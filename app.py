"""Aplicacion Flask para calculos operacionales ACI LATAM — API MPMS."""

from __future__ import annotations

import io
import json

# Carga variables desde .env si existe (ANTHROPIC_API_KEY, etc.)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
from datetime import date, datetime
from pathlib import Path

from flask import Flask, abort, flash, jsonify, redirect, render_template, request, send_file, send_from_directory, url_for
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from calculations import (
    BBL_TO_M3,
    calculate_quantity,
    calculate_quantity_from_gsv,
    calculate_ullage_difference,
    calculate_ullage_phase,
    calculate_vcf_all_tables,
    calculate_vcf_full,
    calculate_vef_17_9,
    difference,
)
from models import (
    add_vef_voyage,
    create_operation,
    delete_vef_voyage,
    get_destinations,
    get_distinct_vessels,
    get_operation,
    get_vef_history,
    get_vef_voyages,
    init_db,
    list_operations,
    register_client_and_vessel,
    record_vef,
    replace_destinations,
    update_operation,
    update_vef_voyage,
)


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_TANK_NAMES = [
    "1P", "1S", "2P", "2S", "3P", "3S", "4P", "4S",
    "5P", "5S", "6P", "6S", "7P", "7S",
]
app = Flask(__name__)
app.config["SECRET_KEY"] = "aci-latam-local-development"



# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def as_float(name: str, default: float = 0.0) -> float:
    raw_value = request.form.get(name, "").strip()
    if not raw_value:
        return default
    try:
        return float(raw_value)
    except ValueError as exc:
        raise ValueError(f"El campo {name} debe ser numerico.") from exc


def validate_range(label: str, value: float, minimum: float, maximum: float) -> None:
    if not minimum <= value <= maximum:
        raise ValueError(f"{label} debe estar entre {minimum} y {maximum}.")


def require_operation(operation_id: int) -> dict:
    operation = get_operation(operation_id)
    if not operation:
        abort(404)
    return operation


def calculate_origin(form_data: dict, table: str) -> dict:
    api = float(form_data["origin_api"])
    bsw_pct = float(form_data["origin_bsw_pct"])
    vessel_vef = float(form_data["origin_vessel_vef"])
    free_water = float(form_data.get("origin_free_water_bbl") or 0)
    input_mode = form_data.get("origin_input_mode", "gov")

    if input_mode == "gsv":
        temperature_f = float(form_data.get("origin_temperature_f") or 60.0)
        shore = calculate_quantity_from_gsv(
            float(form_data["origin_shore_gsv_bbl"]), api, bsw_pct,
            free_water_bbl=free_water, temperature_f=temperature_f, table=table,
        )
        vessel = calculate_quantity_from_gsv(
            float(form_data["origin_vessel_gsv_bbl"]), api, bsw_pct,
            free_water_bbl=0.0, temperature_f=temperature_f,
            vef=vessel_vef, apply_vef=True, table=table,
        )
    else:
        temperature_f = float(form_data["origin_temperature_f"])
        shore = calculate_quantity(
            float(form_data["origin_shore_gov_bbl"]) - free_water,
            api, temperature_f, bsw_pct, table=table,
        )
        vessel = calculate_quantity(
            float(form_data["origin_vessel_gov_bbl"]),
            api, temperature_f, bsw_pct,
            vef=vessel_vef, table=table, apply_vef=True,
        )

    return {
        "api": api,
        "temperature_f": temperature_f,
        "bsw_pct": bsw_pct,
        "free_water_bbl": free_water,
        "input_mode": input_mode,
        "terminal_name": form_data.get("origin_terminal_name", "").strip(),
        "rho15": float(form_data["origin_rho15"]) if form_data.get("origin_rho15") else None,
        "rho20": float(form_data["origin_rho20"]) if form_data.get("origin_rho20") else None,
        "bill_of_lading_bbl": float(form_data["bill_of_lading_bbl"]),
        "shore": shore.to_dict(),
        "vessel": vessel.to_dict(),
    }


def calculate_arrival(data: dict, operation: dict) -> dict:
    mode = operation["operation_mode"]
    table = operation["vcf_table"]
    vef = float(data.get("arrival_vef", 1))
    tanks = data.get("arrival_tanks", [])
    if tanks:
        initial = calculate_ullage_phase(tanks, "initial", vef, table)
        final = calculate_ullage_phase(tanks, "final", vef, table)
        delivered = calculate_ullage_difference(initial, final)
    else:
        api = float(data.get("arrival_api", data.get("origin", {}).get("api", 35)))
        temperature_f = float(data.get("arrival_temperature_f", 60))
        bsw_pct = float(data.get("arrival_bsw_pct", 0))
        initial_gov = float(data.get("arrival_initial_gov_bbl", 0))
        final_gov = float(data.get("arrival_final_gov_bbl", 0))
        initial = calculate_quantity(initial_gov, api, temperature_f, bsw_pct, vef, table, True).to_dict()
        final = calculate_quantity(final_gov, api, temperature_f, bsw_pct, vef, table, True).to_dict()
        delivered_gov = max(initial_gov - final_gov, 0)
        delivered = calculate_quantity(delivered_gov, api, temperature_f, bsw_pct, vef, table, True).to_dict()
    return {"mode": mode, "initial": initial, "final": final, "delivered": delivered}


def parse_arrival_tanks() -> list[dict]:
    M3_TO_BBL = 1.0 / BBL_TO_M3  # 6.28981…

    field_names = [
        "tank_name[]", "reference_height[]",
        "initial_ullage[]", "initial_tov_m3[]", "initial_free_water_m3[]",
        "initial_temperature_f[]", "initial_api[]", "initial_bsw_pct[]",
        "final_ullage[]", "final_tov_m3[]", "final_free_water_m3[]",
        "final_temperature_f[]", "final_api[]", "final_bsw_pct[]",
    ]
    values = {name: request.form.getlist(name) for name in field_names}
    tanks = []
    count = len(values["tank_name[]"])
    for index in range(count):
        def numeric(field: str, default: float = 0.0, idx: int = index) -> float:
            raw = values[field][idx].strip() if idx < len(values[field]) else ""
            return float(raw) if raw else default

        # Convert m³ → bbl for TOV and Free Water
        init_tov_m3 = numeric("initial_tov_m3[]")
        init_fw_m3  = numeric("initial_free_water_m3[]")
        final_tov_m3 = numeric("final_tov_m3[]")
        final_fw_m3  = numeric("final_free_water_m3[]")

        tank = {
            "name": values["tank_name[]"][index].strip() or f"Tanque {index + 1}",
            "reference_height": numeric("reference_height[]"),
            "initial_ullage": numeric("initial_ullage[]"),
            "initial_tov_m3": init_tov_m3,
            "initial_free_water_m3": init_fw_m3,
            "initial_tov_bbl": init_tov_m3 * M3_TO_BBL,
            "initial_free_water_bbl": init_fw_m3 * M3_TO_BBL,
            "initial_temperature_f": numeric("initial_temperature_f[]", 60),
            "initial_api": numeric("initial_api[]", 35),
            "initial_bsw_pct": numeric("initial_bsw_pct[]"),
            "final_ullage": numeric("final_ullage[]"),
            "final_tov_m3": final_tov_m3,
            "final_free_water_m3": final_fw_m3,
            "final_tov_bbl": final_tov_m3 * M3_TO_BBL,
            "final_free_water_bbl": final_fw_m3 * M3_TO_BBL,
            "final_temperature_f": numeric("final_temperature_f[]", 60),
            "final_api": numeric("final_api[]", 35),
            "final_bsw_pct": numeric("final_bsw_pct[]"),
        }
        for phase in ("initial", "final"):
            validate_range(f"API {phase} {tank['name']}", tank[f"{phase}_api"], -10, 100)
            validate_range(f"BS&W {phase} {tank['name']}", tank[f"{phase}_bsw_pct"], 0, 100)
        tanks.append(tank)
    return tanks


def build_summary(operation: dict) -> dict:
    data = operation["data"]
    origin = data.get("origin", {})
    arrival = (
        calculate_arrival(data, operation)
        if data.get("arrival_tanks") or data.get("arrival_initial_gov_bbl") is not None
        else {}
    )
    destinations = get_destinations(operation["id"])
    rows = []

    bill_of_lading = float(origin.get("bill_of_lading_bbl", 0))
    shore_origin = float(origin.get("shore", {}).get("nsv_bbl", 0))
    vessel_origin = float(origin.get("vessel", {}).get("nsv_bbl", 0))
    vessel_arrival = float(arrival.get("initial", {}).get("nsv_bbl", 0))
    destination_total = sum(float(item["result"].get("delivered_nsv_bbl", 0)) for item in destinations)
    vessel_delivered = float(arrival.get("delivered", {}).get("nsv_bbl", 0))
    delivered_total = destination_total or vessel_delivered

    checkpoints = [
        ("B/L vs tierra origen", bill_of_lading, shore_origin, "medicion origen / linea / BSW"),
        ("Tierra origen vs buque origen", shore_origin, vessel_origin, "VEF origen / temperatura / ullage"),
        ("Buque origen vs buque arribo", vessel_origin, vessel_arrival, "VEF destino / ROB / temperatura"),
    ]
    for label, first, second, causes in checkpoints:
        result = difference(first, second)
        rows.append({"label": label, "first": first, "second": second, "causes": causes, **result})

    if vessel_arrival and vessel_delivered:
        result = difference(vessel_arrival, vessel_delivered)
        rows.append({
            "label": "Buque arribo vs cantidad descargada API 12",
            "first": vessel_arrival, "second": vessel_delivered,
            "causes": "remanente final / ROB / ullage inicial-final / VCF / VEF",
            **result,
        })

    for destination in destinations:
        result_data = destination["result"]
        first = float(result_data.get("vessel_nsv_bbl", 0))
        second = float(result_data.get("shore_nsv_bbl", 0))
        result = difference(first, second)
        receiver_label = "buque receptor" if destination["receiver_type"] == "vessel" else "tierra terminal"
        rows.append({
            "label": f"{destination['name']}: ullage vs {receiver_label}",
            "first": first, "second": second,
            "causes": "ullage / VCF / temperatura / agua libre / ajuste de linea",
            **result,
        })

    if bill_of_lading and delivered_total:
        result = difference(bill_of_lading, delivered_total)
        rows.append({
            "label": "Round trip B/L vs entregado total",
            "first": bill_of_lading, "second": delivered_total,
            "causes": "acumulacion de desvios por tramo",
            **result,
        })

    ranked = sorted(rows, key=lambda r: abs(r["percentage"]), reverse=True)
    worst = ranked[0] if ranked else None
    tolerance = float(operation.get("tolerance_pct") or 0)

    if worst:
        status = "Fuera de tolerancia" if abs(worst["percentage"]) > tolerance else "Dentro de tolerancia"
        analysis = (
            f"El mayor desvio esta en '{worst['label']}': {worst['difference']:,.3f} bbl "
            f"({worst['percentage']:.3f}%). {status}. "
            f"Revisar prioritariamente: {worst['causes']}. "
            "El analisis es orientativo y debe confirmarse con documentos de medicion, "
            "temperaturas, tablas de aforo y muestras representativas."
        )
    else:
        analysis = "No hay suficientes cantidades para analizar desvios."

    arrival_initial = arrival.get("initial", {})
    return {
        "origin": origin,
        "arrival": arrival,
        "destinations": destinations,
        "rows": rows,
        "worst": worst,
        "analysis": analysis,
        "delivered_total_bbl": delivered_total,
        "delivered_total_m3": delivered_total * BBL_TO_M3,
        "delivered_total_mt_air": arrival.get("delivered", {}).get("metric_tons_air", 0) or sum(
            float(d["result"].get("metric_tons_air", 0)) for d in destinations
        ),
        "delivered_total_mt_vacuum": arrival.get("delivered", {}).get("metric_tons_vacuum", 0) or sum(
            float(d["result"].get("metric_tons_vacuum", 0)) for d in destinations
        ),
    }


# ---------------------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return send_from_directory("app", "index.html")


@app.post("/operations/new")
def new_operation():
    operation_id = create_operation()
    return redirect(url_for("wizard_step", operation_id=operation_id, step=1))


@app.post("/operations/<int:operation_id>/delete")
def delete_operation(operation_id: int):
    require_operation(operation_id)
    from models import database
    with database() as conn:
        conn.execute("DELETE FROM operations WHERE id = ?", (operation_id,))
    flash("Operacion eliminada.")
    return redirect(url_for("index"))


@app.route("/operations/<int:operation_id>/step/<int:step>", methods=["GET", "POST"])
def wizard_step(operation_id: int, step: int):
    if step not in {1, 2, 3, 4}:
        abort(404)
    operation = require_operation(operation_id)
    errors = []

    if request.method == "POST":
        try:
            if step == 1:
                start_date = request.form.get("start_date", "")
                end_date = request.form.get("end_date", "")
                tolerance = as_float("tolerance_pct", 0.25)
                validate_range("Tolerancia", tolerance, 0, 10)
                if start_date and end_date and end_date < start_date:
                    raise ValueError("La fecha de termino no puede ser anterior a la de inicio.")
                columns = {
                    "client_name": request.form.get("client_name", "").strip(),
                    "client_type": request.form.get("client_type", "").strip(),
                    "port": request.form.get("port", "").strip(),
                    "external_reference": request.form.get("external_reference", "").strip(),
                    "aci_reference": request.form.get("aci_reference", "").strip(),
                    "vessel_name": request.form.get("vessel_name", "").strip(),
                    "voyage_number": request.form.get("voyage_number", "").strip(),
                    "imo": request.form.get("imo", "").strip(),
                    "start_date": start_date,
                    "end_date": end_date,
                    "product": request.form.get("product", "").strip(),
                    "inspection_company": request.form.get("inspection_company", "ACI LATAM").strip(),
                    "tolerance_pct": tolerance,
                    "vcf_table": request.form.get("vcf_table", "6B"),
                    "current_step": 2,
                }
                if not columns["client_name"] or not columns["vessel_name"] or not columns["product"]:
                    raise ValueError("Cliente, buque y producto son obligatorios.")
                update_operation(operation_id, columns)
                register_client_and_vessel(
                    columns["client_name"], columns["client_type"],
                    columns["vessel_name"], columns["imo"], columns["voyage_number"],
                )

            elif step == 2:
                api_gravity = as_float("origin_api")
                bsw_pct = as_float("origin_bsw_pct")
                vef = as_float("origin_vessel_vef", 1)
                input_mode = request.form.get("origin_input_mode", "gov")
                validate_range("API", api_gravity, -10, 100)
                validate_range("BS&W", bsw_pct, 0, 100)
                validate_range("VEF", vef, 0.8, 1.2)
                form_data: dict = {
                    "origin_api": api_gravity,
                    "origin_bsw_pct": bsw_pct,
                    "origin_vessel_vef": vef,
                    "origin_input_mode": input_mode,
                    "origin_free_water_bbl": as_float("origin_free_water_bbl", 0),
                    "bill_of_lading_bbl": as_float("bill_of_lading_bbl"),
                }
                if input_mode == "gsv":
                    temperature_f = as_float("origin_temperature_f", 60)
                    validate_range("Temperatura", temperature_f, -58, 302)
                    form_data["origin_temperature_f"] = temperature_f
                    form_data["origin_shore_gsv_bbl"] = as_float("origin_shore_gsv_bbl")
                    form_data["origin_vessel_gsv_bbl"] = as_float("origin_vessel_gsv_bbl")
                else:
                    temperature_f = as_float("origin_temperature_f", 60)
                    validate_range("Temperatura", temperature_f, -58, 302)
                    form_data["origin_temperature_f"] = temperature_f
                    form_data["origin_shore_gov_bbl"] = as_float("origin_shore_gov_bbl")
                    form_data["origin_vessel_gov_bbl"] = as_float("origin_vessel_gov_bbl")
                origin = calculate_origin(
                    {k: str(v) for k, v in form_data.items()}, operation["vcf_table"]
                )
                data = operation["data"]
                data["origin"] = origin
                update_operation(operation_id, {"current_step": 3}, data)
                record_vef(operation_id, operation["vessel_name"], vef, "origin")

            elif step == 3:
                mode = request.form.get("operation_mode", "arrival_vef")
                vef = as_float("arrival_vef", 1)
                validate_range("VEF al arribo", vef, 0.8, 1.2)
                tanks = parse_arrival_tanks()
                if not any(tank["initial_tov_bbl"] > 0 for tank in tanks):
                    raise ValueError("Ingrese al menos un TOV inicial de la tabla de calibracion.")
                data = operation["data"]
                data.update({"arrival_vef": vef, "arrival_tanks": tanks})
                update_operation(
                    operation_id,
                    {
                        "operation_mode": mode,
                        "key_meeting": request.form.get("key_meeting", ""),
                        "time_log": request.form.get("time_log", ""),
                        "pumping_log": request.form.get("pumping_log", ""),
                        "current_step": 4,
                    },
                    data,
                )
                record_vef(operation_id, operation["vessel_name"], vef, "arrival")

            elif step == 4:
                names = request.form.getlist("destination_name[]")
                receiver_types = request.form.getlist("receiver_type[]")
                ports = request.form.getlist("destination_port[]")
                destinations = []
                for index, name in enumerate(names):
                    if not name.strip():
                        continue
                    receiver_type = receiver_types[index]
                    initial_gov = float(request.form.getlist("initial_gov_bbl[]")[index] or 0)
                    final_gov = float(request.form.getlist("final_gov_bbl[]")[index] or 0)
                    temperature_f = float(request.form.getlist("destination_temperature_f[]")[index] or 60)
                    api_gravity = float(request.form.getlist("destination_api[]")[index] or 35)
                    bsw_pct = float(request.form.getlist("destination_bsw_pct[]")[index] or 0)
                    vef = float(request.form.getlist("destination_vef[]")[index] or 1)
                    line_adjustment = float(request.form.getlist("line_adjustment_bbl[]")[index] or 0)
                    validate_range(f"API de {name}", api_gravity, -10, 100)
                    validate_range(f"BS&W de {name}", bsw_pct, 0, 100)
                    delivered_gov = max(initial_gov - final_gov, 0)
                    vessel_result = calculate_quantity(
                        delivered_gov, api_gravity, temperature_f, bsw_pct,
                        vef, operation["vcf_table"], receiver_type == "vessel",
                    )
                    shore_nsv = vessel_result.nsv_bbl + line_adjustment
                    destinations.append({
                        "name": name.strip(),
                        "receiver_type": receiver_type,
                        "port": ports[index],
                        "initial_gov_bbl": initial_gov,
                        "final_gov_bbl": final_gov,
                        "temperature_f": temperature_f,
                        "api": api_gravity,
                        "bsw_pct": bsw_pct,
                        "vef": vef,
                        "line_adjustment_bbl": line_adjustment,
                        "result": {
                            **vessel_result.to_dict(),
                            "vessel_nsv_bbl": vessel_result.nsv_bbl,
                            "shore_nsv_bbl": shore_nsv,
                            "delivered_nsv_bbl": shore_nsv,
                        },
                    })
                if operation["operation_mode"] == "arrival_multi" and not destinations:
                    raise ValueError("Agregue al menos un receptor o destino.")
                replace_destinations(operation_id, destinations)
                update_operation(operation_id, {"current_step": 5, "status": "complete"})

            next_url = (
                url_for("summary", operation_id=operation_id)
                if step == 4
                else url_for("wizard_step", operation_id=operation_id, step=step + 1)
            )
            return redirect(next_url)

        except (ValueError, IndexError) as exc:
            errors.append(str(exc))

    operation = require_operation(operation_id)
    vef_history = get_vef_history(operation.get("vessel_name", ""), limit=5) if operation.get("vessel_name") else []
    return render_template(
        f"step{step}.html",
        operation=operation,
        destinations=get_destinations(operation_id),
        tank_rows=(
            operation["data"].get("arrival_tanks")
            or [{"name": name} for name in DEFAULT_TANK_NAMES]
        ),
        vef_history=vef_history,
        errors=errors,
        step=step,
    )


@app.get("/operations/<int:operation_id>/summary")
def summary(operation_id: int):
    operation = require_operation(operation_id)
    return render_template(
        "summary.html",
        operation=operation,
        summary=build_summary(operation),
        step=5,
    )


# ---------------------------------------------------------------------------
# Endpoint AJAX para calculos en tiempo real
# ---------------------------------------------------------------------------

@app.post("/api/calculate")
def api_calculate():
    """Calculo volumetrico en tiempo real para el wizard (AJAX)."""
    data = request.get_json(silent=True) or {}
    try:
        gov = float(data.get("gov_bbl") or 0)
        api_g = float(data.get("api") or 35)
        temp_f = float(data.get("temperature_f") or 60)
        bsw = float(data.get("bsw_pct") or 0)
        vef = float(data.get("vef") or 1.0)
        table = str(data.get("table") or "6B")
        apply_vef = bool(data.get("apply_vef", False))
        result = calculate_quantity(gov, api_g, temp_f, bsw, vef, table, apply_vef)
        return jsonify({"ok": True, **result.to_dict()})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400


@app.get("/api/vcf-compare")
def api_vcf_compare():
    """VCF de las 4 tablas para un mismo API y temperatura (cross-check)."""
    try:
        api_g = float(request.args.get("api") or 35)
        temp_f = float(request.args.get("temperature_f") or 60)
        return jsonify({"ok": True, "results": calculate_vcf_all_tables(api_g, temp_f)})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400


# ---------------------------------------------------------------------------
# Historial VEF
# ---------------------------------------------------------------------------

@app.get("/vessels/vef-history")
def vef_history_page():
    vessel = request.args.get("vessel", "")
    history = get_vef_history(vessel, limit=50) if vessel else []
    return render_template("vef_history.html", vessel=vessel, history=history)


@app.get("/vessels/vef-calculator")
def vef_calculator_page():
    vessel = request.args.get("vessel", "")
    voyages = get_vef_voyages(vessel, limit=20) if vessel else []
    vessels = get_distinct_vessels()
    return render_template(
        "vef_calculator.html",
        vessel=vessel,
        voyages=voyages,
        vessels=vessels,
    )


@app.post("/vessels/vef-calculator/voyage/add")
def vef_voyage_add():
    vessel = request.form.get("vessel_name", "").strip()
    if not vessel:
        flash("Nombre de buque requerido.")
        return redirect(url_for("vef_calculator_page"))
    data = {
        "voyage_number": request.form.get("voyage_number", "").strip(),
        "voyage_date": request.form.get("voyage_date", ""),
        "port": request.form.get("port", "").strip(),
        "cargo": request.form.get("cargo", "").strip(),
        "ship_figure": request.form.get("ship_figure", "0"),
        "shore_figure": request.form.get("shore_figure", "0"),
        "obq_rob": request.form.get("obq_rob", "0"),
        "reject_flags": request.form.getlist("reject_flags"),
        "notes": request.form.get("notes", "").strip(),
    }
    add_vef_voyage(vessel, data)
    return redirect(url_for("vef_calculator_page", vessel=vessel))


@app.post("/vessels/vef-calculator/voyage/<int:voyage_id>/delete")
def vef_voyage_delete(voyage_id: int):
    vessel = request.form.get("vessel_name", "")
    delete_vef_voyage(voyage_id)
    return redirect(url_for("vef_calculator_page", vessel=vessel))


@app.post("/vessels/vef-calculator/voyage/<int:voyage_id>/update")
def vef_voyage_update(voyage_id: int):
    vessel = request.form.get("vessel_name", "")
    data = {
        "voyage_number": request.form.get("voyage_number", "").strip(),
        "voyage_date": request.form.get("voyage_date", ""),
        "port": request.form.get("port", "").strip(),
        "cargo": request.form.get("cargo", "").strip(),
        "ship_figure": request.form.get("ship_figure", "0"),
        "shore_figure": request.form.get("shore_figure", "0"),
        "obq_rob": request.form.get("obq_rob", "0"),
        "reject_flags": request.form.getlist("reject_flags"),
        "notes": request.form.get("notes", "").strip(),
    }
    update_vef_voyage(voyage_id, data)
    return redirect(url_for("vef_calculator_page", vessel=vessel))


@app.post("/api/vef-calculate")
def api_vef_calculate():
    """Calcula VEF per API MPMS 17.9 sobre un conjunto de viajes (JSON)."""
    data = request.get_json(silent=True) or {}
    voyages = data.get("voyages", [])
    try:
        result = calculate_vef_17_9(voyages)
        return jsonify({"ok": True, **result})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400


# ---------------------------------------------------------------------------
# Exportacion PDF
# ---------------------------------------------------------------------------

NAVY = colors.HexColor("#07313c")
TEAL = colors.HexColor("#0f8583")
LIGHT_ROW = colors.HexColor("#f3f8f8")
BORDER = colors.HexColor("#c9d5d8")
WHITE = colors.white
RED_CELL = colors.HexColor("#fdecea")
AMBER_CELL = colors.HexColor("#fff8e1")
GREEN_CELL = colors.HexColor("#e8f5e9")


def _header_style() -> TableStyle:
    return TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_ROW]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])


def _section_para(text: str, styles) -> Paragraph:
    style = ParagraphStyle(
        "section", parent=styles["Normal"],
        fontSize=9, textColor=TEAL, spaceAfter=4, spaceBefore=10,
        fontName="Helvetica-Bold",
    )
    return Paragraph(text.upper(), style)


@app.get("/operations/<int:operation_id>/pdf")
def export_pdf(operation_id: int):
    operation = require_operation(operation_id)
    summary_data = build_summary(operation)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4),
        leftMargin=12 * mm, rightMargin=12 * mm,
        topMargin=14 * mm, bottomMargin=14 * mm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title", parent=styles["Title"], fontSize=14,
        textColor=NAVY, spaceAfter=2,
    )
    subtitle_style = ParagraphStyle(
        "subtitle", parent=styles["Normal"], fontSize=8,
        textColor=colors.HexColor("#62747a"), spaceAfter=8,
    )
    normal_small = ParagraphStyle(
        "small", parent=styles["Normal"], fontSize=7.5, spaceAfter=3,
    )

    elements = [
        Paragraph("ACI LATAM — Informe de Cantidades", title_style),
        Paragraph(
            f"Ref. ACI: {operation.get('aci_reference') or '-'}  |  "
            f"Ref. externa: {operation.get('external_reference') or '-'}  |  "
            f"Cliente: {operation.get('client_name') or '-'}  |  "
            f"Buque: {operation.get('vessel_name') or '-'}  (IMO {operation.get('imo') or '-'})  |  "
            f"Viaje: {operation.get('voyage_number') or '-'}",
            subtitle_style,
        ),
        Paragraph(
            f"Producto: {operation.get('product') or '-'}  |  "
            f"Puerto: {operation.get('port') or '-'}  |  "
            f"Inicio: {operation.get('start_date') or '-'}  |  "
            f"Termino: {operation.get('end_date') or '-'}  |  "
            f"Tabla VCF: {operation.get('vcf_table') or '6B'}  |  "
            f"Tolerancia: {operation.get('tolerance_pct') or 0.25}%  |  "
            f"Compania: {operation.get('inspection_company') or 'ACI LATAM'}",
            subtitle_style,
        ),
    ]

    # Cantidades de origen
    origin = summary_data.get("origin", {})
    if origin:
        elements.append(_section_para("Cantidades de origen", styles))
        origin_data = [
            ["Concepto", "GOV bbl", "VCF", "GSV bbl", "NSV bbl", "m³ @15°C", "MT aire", "MT vacío", "API", "BS&W %"],
        ]
        for label, src in [("Tierra origen", origin.get("shore", {})), ("Buque origen (VEF)", origin.get("vessel", {}))]:
            origin_data.append([
                label,
                f"{src.get('gov_bbl', 0):,.3f}",
                f"{src.get('vcf', 0):.5f}",
                f"{src.get('gsv_bbl', 0):,.3f}",
                f"{src.get('nsv_bbl', 0):,.3f}",
                f"{src.get('nsv_m3_15c', 0):,.3f}",
                f"{src.get('metric_tons_air', 0):,.3f}",
                f"{src.get('metric_tons_vacuum', 0):,.3f}",
                f"{src.get('api', 0):.2f}",
                f"{src.get('bsw_pct', 0):.3f}%",
            ])
        origin_data.append([
            "Bill of Lading",
            f"{origin.get('bill_of_lading_bbl', 0):,.3f}", "", "", "", "", "", "", "", "",
        ])
        ot = Table(origin_data, colWidths=[38*mm, 26*mm, 18*mm, 26*mm, 26*mm, 24*mm, 22*mm, 22*mm, 16*mm, 18*mm])
        ot.setStyle(_header_style())
        elements.extend([ot, Spacer(1, 6)])

    # Ullage inicial y final
    arrival = summary_data.get("arrival", {})
    if arrival.get("initial"):
        elements.append(_section_para("Ullage arribo / descarga — API MPMS 11.1 / 12.1.1", styles))
        ullage_data = [
            ["Fase", "TOV bbl", "FW bbl", "GOV bbl", "VCF", "GSV bbl", "NSV bbl", "m³ @15°C", "MT aire", "MT vacío", "API", "Dens. kg/m³"],
        ]
        for label, vals in [
            ("Inicial", arrival["initial"]),
            ("Final", arrival["final"]),
            ("Descargado", arrival["delivered"]),
        ]:
            ullage_data.append([
                label,
                f"{vals.get('tov_bbl', vals.get('gov_bbl', 0)):,.3f}",
                f"{vals.get('free_water_bbl', 0):,.3f}",
                f"{vals.get('gov_bbl', 0):,.3f}",
                f"{vals.get('vcf', 0):.5f}",
                f"{vals.get('gsv_bbl', 0):,.3f}",
                f"{vals.get('nsv_bbl', 0):,.3f}",
                f"{vals.get('nsv_m3_15c', 0):,.3f}",
                f"{vals.get('metric_tons_air', 0):,.3f}",
                f"{vals.get('metric_tons_vacuum', 0):,.3f}",
                f"{vals.get('api', 0):.2f}",
                f"{vals.get('density_15c_kgm3', 0):.2f}",
            ])
        ut = Table(ullage_data, colWidths=[18*mm, 22*mm, 18*mm, 22*mm, 16*mm, 22*mm, 22*mm, 20*mm, 20*mm, 20*mm, 14*mm, 22*mm])
        ut.setStyle(_header_style())
        elements.extend([ut, Spacer(1, 6)])

        # Detalle por tanque
        initial_tanks = arrival["initial"].get("tanks", [])
        final_tanks = arrival["final"].get("tanks", [])
        if initial_tanks:
            elements.append(Paragraph("Detalle por tanque — Inicial", normal_small))
            tank_data = [["Tanque", "Ullage", "TOV bbl", "FW bbl", "GOV bbl", "API", "Temp °F", "VCF", "GSV bbl", "NSV bbl"]]
            for t in initial_tanks:
                tank_data.append([
                    t.get("name", ""),
                    f"{t.get('ullage', 0):.3f}",
                    f"{t.get('tov_bbl', 0):,.3f}",
                    f"{t.get('free_water_bbl', 0):,.3f}",
                    f"{t.get('gov_bbl', 0):,.3f}",
                    f"{t.get('api', 0):.2f}",
                    f"{t.get('temperature_f', 60):.1f}",  # not stored per tank in result dict, approximate
                    f"{t.get('vcf', 0):.5f}",
                    f"{t.get('gsv_bbl', 0):,.3f}",
                    f"{t.get('nsv_bbl', 0):,.3f}",
                ])
            td = Table(tank_data, colWidths=[16*mm, 18*mm, 22*mm, 18*mm, 22*mm, 14*mm, 16*mm, 16*mm, 22*mm, 22*mm])
            td.setStyle(_header_style())
            elements.extend([td, Spacer(1, 6)])

    # Destinos
    destinations = summary_data.get("destinations", [])
    if destinations:
        elements.append(_section_para("Destinos / receptores", styles))
        dest_data = [["Destino", "Tipo", "API", "Temp °F", "BS&W %", "VCF", "VEF", "GOV bbl", "GSV bbl", "NSV bbl", "m³ @15°C", "MT aire"]]
        for d in destinations:
            r = d["result"]
            dest_data.append([
                d.get("name", ""),
                "Buque" if d.get("receiver_type") == "vessel" else "Tierra",
                f"{r.get('api', 0):.2f}",
                f"{d.get('temperature_f', 60):.1f}",
                f"{r.get('bsw_pct', 0):.3f}%",
                f"{r.get('vcf', 0):.5f}",
                f"{r.get('vef', 1):.6f}",
                f"{r.get('gov_bbl', 0):,.3f}",
                f"{r.get('gsv_bbl', 0):,.3f}",
                f"{r.get('delivered_nsv_bbl', 0):,.3f}",
                f"{r.get('nsv_m3_15c', 0):,.3f}",
                f"{r.get('metric_tons_air', 0):,.3f}",
            ])
        dt = Table(dest_data, colWidths=[32*mm, 16*mm, 14*mm, 14*mm, 16*mm, 16*mm, 18*mm, 22*mm, 22*mm, 22*mm, 20*mm, 20*mm])
        dt.setStyle(_header_style())
        elements.extend([dt, Spacer(1, 6)])

    # Tabla de balances
    tolerance = float(operation.get("tolerance_pct") or 0.25)
    elements.append(_section_para("Compendio de balances — NSV bbl", styles))
    bal_data = [["Tramo", "Base A NSV bbl", "Base B NSV bbl", "Diferencia bbl", "%", "Estado"]]
    bal_style_cmds = list(_header_style().getCommands())
    for row_idx, row in enumerate(summary_data["rows"], start=1):
        abs_pct = abs(row["percentage"])
        if abs_pct <= tolerance:
            cell_bg = GREEN_CELL
            status_text = "OK"
        elif abs_pct <= tolerance * 1.5:
            cell_bg = AMBER_CELL
            status_text = "LIMITE"
        else:
            cell_bg = RED_CELL
            status_text = "ALERTA"
        bal_data.append([
            row["label"],
            f"{row['first']:,.3f}",
            f"{row['second']:,.3f}",
            f"{row['difference']:,.3f}",
            f"{row['percentage']:.3f}%",
            status_text,
        ])
        bal_style_cmds.append(("BACKGROUND", (5, row_idx), (5, row_idx), cell_bg))
    bal_table = Table(bal_data, colWidths=[94*mm, 34*mm, 34*mm, 34*mm, 24*mm, 20*mm])
    bal_table.setStyle(TableStyle(bal_style_cmds))
    elements.extend([bal_table, Spacer(1, 8)])

    # Analisis
    analysis_style = ParagraphStyle(
        "analysis", parent=styles["BodyText"],
        fontSize=8, borderColor=TEAL, borderWidth=0, borderPadding=8,
        backColor=colors.HexColor("#edf8f6"), leftIndent=6, rightIndent=6,
        spaceBefore=4, spaceAfter=4,
    )
    elements.append(Paragraph(summary_data["analysis"], analysis_style))

    doc.build(elements)
    buffer.seek(0)
    filename = f"ACI-{operation_id}-{(operation.get('aci_reference') or 'OP').replace('/', '-')}.pdf"
    return send_file(buffer, mimetype="application/pdf", as_attachment=True, download_name=filename)


# ---------------------------------------------------------------------------
# Rutas estáticas — módulos SPA (operaciones, bt) y assets
# ---------------------------------------------------------------------------

@app.route("/operaciones")
@app.route("/operaciones/")
def serve_operaciones():
    return send_from_directory("operaciones", "index.html")


@app.route("/operaciones/<path:filename>")
def serve_operaciones_static(filename):
    return send_from_directory("operaciones", filename)


@app.route("/bt")
@app.route("/bt/")
def serve_bt():
    return send_from_directory("bt", "index.html")


@app.route("/bt/<path:filename>")
def serve_bt_static(filename):
    return send_from_directory("bt", filename)


@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return send_from_directory("assets", filename)


@app.route("/site.css")
def serve_site_css():
    return send_from_directory(".", "site.css")


@app.route("/site.js")
def serve_site_js():
    return send_from_directory(".", "site.js")


@app.route("/favicon.ico")
def serve_favicon_ico():
    return send_from_directory(".", "favicon.ico")


# ---------------------------------------------------------------------------
# Persistencia de datos de la SPA (ops.json / counters.json)
# ---------------------------------------------------------------------------

_DATA_DIR = BASE_DIR / "data"
_DATA_DIR.mkdir(exist_ok=True)

def _read_json(name: str):
    p = _DATA_DIR / name
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            pass
    return None

def _write_json(name: str, payload) -> None:
    (_DATA_DIR / name).write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


@app.get("/api/ops")
def spa_get_ops():
    data = _read_json("ops.json")
    return jsonify(data if data is not None else [])


@app.post("/api/ops")
def spa_save_ops():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"ok": False, "error": "JSON inválido"}), 400
    _write_json("ops.json", payload)
    return jsonify({"ok": True})


@app.get("/api/counters")
def spa_get_counters():
    data = _read_json("counters.json")
    return jsonify(data if data is not None else {})


@app.post("/api/counters")
def spa_save_counters():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"ok": False, "error": "JSON inválido"}), 400
    _write_json("counters.json", payload)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# SPA principal — sirve app/ en la raíz
# ---------------------------------------------------------------------------

@app.route("/app.js")
def serve_spa_js():
    return send_from_directory("app", "app.js")


@app.route("/app.css")
def serve_spa_css():
    return send_from_directory("app", "app.css")


@app.route("/demo-acich002.json")
def serve_spa_demo():
    return send_from_directory("app", "demo-acich002.json")


@app.route("/spa")
@app.route("/spa/")
@app.route("/loss-control")
@app.route("/loss-control/")
def serve_spa():
    return send_from_directory("app", "index.html")


# ---------------------------------------------------------------------------
# Consultor IA — API MPMS
# ---------------------------------------------------------------------------

CONSULTOR_SYSTEM_PROMPT = """Eres un experto en medición y custody transfer de petróleo crudo y productos
refinados, con más de 25 años de experiencia operativa en terminales marítimas y Loss Control.
Tu conocimiento abarca la totalidad de las normas API MPMS (Manual of Petroleum Measurement Standards),
capítulos 1 al 23, con especial dominio en:

NORMAS CLAVE:
- Cap. 2: Calibración de tanques de tierra y buques (tablas de capacidad)
- Cap. 3: Medición de nivel en tanques — innage, ullage, flotadores, radar
- Cap. 4: Muestreo de hidrocarburos — inline, manual, compuesto
- Cap. 5: Medición de flujo por instrumentos — turbina, coriolis, ultrasónico
- Cap. 7: Temperatura — termómetros, RTDs, sistemas automáticos
- Cap. 8: Densidad — hidrómetros, densímetros en línea, laboratorio
- Cap. 9: BSW (Basic Sediment and Water) — centrifugado, Karl Fischer
- Cap. 10: Determinación de agua libre en tanques
- Cap. 11.1: VCF (Volume Correction Factor) — tablas 6A, 6B, 6C, 6D para crudos,
  products, lubricantes y generalized crude; conversión GOV→GSV→NSV
- Cap. 11.2: Conversiones de volumen y masa (MTons, m³, BBL)
- Cap. 12: Calculation of Petroleum Quantities — medición estática y dinámica
- Cap. 13: Evaporative Loss Measurement
- Cap. 14: Natural Gas Measurement
- Cap. 15: Guía de equipos de medición
- Cap. 17: Marine Measurement (crítico para Loss Control):
  * 17.01: Vocabulario marino
  * 17.02: Preparación y inspección de buques tanque
  * 17.04: Medición de ullage/innage en buques
  * 17.05: Determinación de agua libre a bordo
  * 17.06: Muestreo en buques tanque
  * 17.07: Temperature measurement on board
  * 17.09: VEF (Vessel Experience Factor) — definición, cálculo, banco de datos mínimo
    de 6 viajes consecutivos, correcciones por trimado y escora, límites de aplicación
  * 17.11: Entrega y recepción de petróleo en operaciones Ship-to-Ship
- Cap. 18: Custody Transfer — documentación, certificados (BL, CCQ, Notice of Readiness)
- Cap. 19: Evaporative Loss Measurement
- Cap. 20: Measurement of Multiphase Flow
- Cap. 21: Flow Measurement Using Electronic Metering Systems
- Cap. 22: Testing Protocols for Gas Meters
- Cap. 23: Densitometer installations

ÁREAS DE EXPERTISE ADICIONAL:
- Análisis de discrepancias shore-vessel: causas técnicas vs. operativas
- Cálculo e interpretación de OBQ (On Board Quantity) y ROB (Remaining on Board)
- Trim correction, list correction, wedge formula para tanques parcialmente llenos
- Factores de inertización (N₂) y vapores de hidrocarburo en espacio de ullage
- Certificados de calidad: viscosidad, densidad a 15°C/60°F, flash point, pour point
- Procedimientos de protesta (Quantity Protest, Letter of Indemnity)
- Time sheet y NOR (Notice of Readiness), SOF (Statement of Facts)
- Contratos de compraventa: INCOTERMS FOB, CIF, CFR en el contexto de medición
- Arbitraje técnico y peritaje en disputas de Loss Control
- Regulaciones de la OMI (MARPOL) relacionadas con medición de carga
- Normas ASTM relevantes: D1298, D4052, D4006, D4007, D95, D473

CRITERIOS DE ANÁLISIS:
Cuando analices disputas de Loss Control, considera:
1. ¿Se siguieron los procedimientos API MPMS correctamente en cada punto de medición?
2. ¿Los instrumentos estaban calibrados y dentro del rango operativo?
3. ¿Las condiciones ambientales (temperatura, presión atmosférica, estado del mar) fueron correctamente registradas?
4. ¿Hay consistencia entre todas las fuentes de datos (BL, CCQ, outturn certificate)?
5. ¿El VEF aplicado tiene respaldo estadístico suficiente (mínimo 6 viajes)?
6. ¿Las diferencias están dentro de las tolerancias aceptadas por la industria?
   - Transferencias shore: 0.05% a 0.20% según API 18.2
   - Ship-to-ship (STS): hasta 0.30% según API 17.11
   - VEF band: ±0.003 para considerar el factor estable
7. ¿Hay factores no cuantificables (oil-on-water, vaporización, derrames)?

Responde siempre en español, con precisión técnica. Cuando cites normas, indica el capítulo
y sección específica. Cuando calcules o estimes, muestra el procedimiento paso a paso.
Si detectas una práctica que contradice la norma API, señálalo claramente con la referencia exacta.
"""


@app.route("/consultor")
def consultor_page():
    return render_template("consultor.html")


@app.route("/api/consultar", methods=["POST"])
def api_consultar():
    import os
    try:
        import anthropic as _anthropic
    except ImportError:
        return jsonify({"error": "Paquete 'anthropic' no instalado. Ejecuta: pip install anthropic"}), 500

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY no configurada. Agrega la variable de entorno antes de iniciar el servidor."}), 500

    data = request.get_json(silent=True) or {}
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "Sin mensajes."}), 400

    # Validate message structure
    valid = []
    for m in messages:
        if isinstance(m, dict) and m.get("role") in ("user", "assistant") and m.get("content"):
            valid.append({"role": m["role"], "content": str(m["content"])[:8000]})
    if not valid:
        return jsonify({"error": "Mensajes inválidos."}), 400

    try:
        client = _anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=2048,
            system=CONSULTOR_SYSTEM_PROMPT,
            messages=valid,
        )
        reply = next((b.text for b in response.content if b.type == "text"), "")
        return jsonify({"reply": reply})
    except _anthropic.AuthenticationError:
        return jsonify({"error": "API key inválida. Verifica ANTHROPIC_API_KEY."}), 401
    except _anthropic.RateLimitError:
        return jsonify({"error": "Límite de tasa alcanzado. Intenta en unos segundos."}), 429
    except _anthropic.APIStatusError as exc:
        return jsonify({"error": f"Error de API ({exc.status_code}): {exc.message}"}), 500
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.route("/checklist")
def checklist_page():
    return render_template("checklist.html")


if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=3030, debug=True)
