"""Calculos volumetricos para la aplicacion ACI LATAM.

Las ecuaciones VCF replican el algoritmo de las tablas 6A, 6B, 6C y 6D de
API MPMS Capitulo 11.1. Antes de emitir documentos contractuales los resultados
deben contrastarse con la edicion licenciada vigente.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from math import exp


BBL_TO_M3 = 0.158987294928
KG_M3_WATER_60F = 999.016


@dataclass
class QuantityResult:
    """Resultado normalizado de una medicion petrolera conforme API MPMS."""

    gov_bbl: float
    gsv_bbl: float
    nsv_bbl: float
    gsv_m3_15c: float
    nsv_m3_15c: float
    metric_tons_air: float
    metric_tons_vacuum: float
    density_15c: float         # gravedad especifica 15/15 °C (adimensional, ≈ t/m3)
    density_15c_kgm3: float    # densidad en kg/m3 a 15 °C
    api: float
    bsw_pct: float
    vcf: float
    vef: float
    vcf_table: str             # tabla usada: 6A / 6B / 6C / 6D
    product_group: str         # grupo dentro de 6B, o descriptor de tabla

    def to_dict(self) -> dict:
        return asdict(self)


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def density_60f_from_api(api_gravity: float) -> float:
    """Densidad de referencia a 60 °F en kg/m3 desde gravedad API."""
    return (141.5 / (api_gravity + 131.5)) * KG_M3_WATER_60F


def density_15c_from_api(api_gravity: float) -> float:
    """Gravedad especifica 15/15 °C (adimensional). Aproximada; usa tablas 53 para contratos."""
    return density_60f_from_api(api_gravity) / KG_M3_WATER_60F


def corrected_temperature_f(temperature_f: float) -> float:
    """Aplica correccion ITS-90 utilizada por el algoritmo de tablas API 11.1."""
    x = ((temperature_f - 32.0) / 1.8) / 630.0
    polynomial = 7.438081 + (-3.536296 * x) * x
    polynomial = -1.871251 + polynomial * x
    polynomial = -4.089591 + polynomial * x
    polynomial = 1.269056 + polynomial * x
    polynomial = 1.08076 + polynomial * x
    polynomial = -0.267408 + polynomial * x
    polynomial = -0.148759 + polynomial * x
    delta_t = polynomial * x
    return ((((temperature_f - 32.0) / 1.8) - delta_t) * 1.8) + 32.0


def _rho_star(rho_60: float, coefficient_a: float, coefficient_b: float) -> float:
    numerator = exp(coefficient_a * (1 + 0.8 * coefficient_a)) - 1
    denominator = 1 + coefficient_a * (1 + 1.6 * coefficient_a) * coefficient_b
    return rho_60 * (1 + numerator / denominator)


def _vcf_from_lambda(lambda_value: float, temperature_f: float) -> float:
    corrected = corrected_temperature_f(temperature_f)
    delta = corrected - 60.0068749
    value = exp(-lambda_value * delta * (1 + 0.8 * lambda_value * (delta + 0.01374979547)))
    return round(value, 5)


def _constants_table_6b(rho_60: float) -> tuple[float, float, float, str]:
    """Constantes por grupo de producto para Tabla 6B (API MPMS 11.1 – 2004).

    Rangos de densidad a 60 °F (kg/m³) y nombres de grupo según el estándar:
      Grupo IV  – Fuel Oil   : 838.3127 ≤ ρ ≤ 1163.5   (API ≈ -10 a 37.1)
      Grupo III – Jet Fuel   : 787.5195 ≤ ρ < 838.3127  (API ≈ 37.1 a 48.0)
      Transición             : 770.352  ≤ ρ < 787.5195  (API ≈ 48.0 a 52.0)
      Grupo I   – Gasolina   : 610.6    ≤ ρ < 770.352   (API ≈ 52.0 a 100.0)

    K2 Transición = -0.0018684 (valor exacto API MPMS 11.1, confirmado en F.C.V._A-B-C-D.xlsx).
    """
    if 838.3127 <= rho_60 <= 1163.5:
        return 103.872, 0.2701, 0.0, "6B – Grupo IV (Fuel Oil / Crudo pesado)"
    if 787.5195 <= rho_60 < 838.3127:
        return 330.301, 0.0, 0.0, "6B – Grupo III (Jet Fuel / Kerosene)"
    if 770.352 <= rho_60 < 787.5195:
        return 1489.067, 0.0, -0.0018684, "6B – Transición"
    if 610.6 <= rho_60 < 770.352:
        return 192.4571, 0.2438, 0.0, "6B – Grupo I (Gasolina / Nafta)"
    raise ValueError(
        f"Densidad {rho_60:.3f} kg/m³ fuera del rango 6B (610.6 – 1163.5 kg/m³). "
        "Verifique el API ingresado o use Tabla 6A (crudo) / 6C / 6D."
    )


def calculate_vcf(api_gravity: float, temperature_f: float, table: str = "6B") -> float:
    """VCF (CTL) para tablas 6A, 6B, 6C o 6D. Retorna solo el factor."""
    vcf, _ = calculate_vcf_full(api_gravity, temperature_f, table)
    return vcf


def calculate_vcf_full(api_gravity: float, temperature_f: float, table: str = "6B") -> tuple[float, str]:
    """VCF (CTL) + nombre de grupo de producto.

    Implementa API MPMS Chapter 11, Section 1 (2004 edition).
    Algoritmo validado contra F.C.V._A-B-C-D_desbloqueado.xlsx.

    Secuencia por tabla:
      6A (Crudo)    : λ = 341.0957 / ρ*²
      6B (Refinados): λ = K0/ρ*² + K1/ρ* + K2  (K según grupo de densidad)
      6C (MTBE)     : λ = 0.000789  (constante)
      6D (Lubric.)  : λ = 0.34878  / ρ*

    Corrección ITS-90 aplicada sobre temperatura antes de calcular VCF.
    ρ₆₀ = (141.5 / (API + 131.5)) × 999.016   [kg/m³]
    δ₆₀ = 0.01374979547
    """
    rho_60 = density_60f_from_api(api_gravity)
    delta_60 = 0.01374979547
    table_up = table.upper()

    if table_up == "6A":
        lambda_60 = 341.0957 / rho_60 ** 2
        coeff_a = (delta_60 / 2) * lambda_60
        rho_star = _rho_star(rho_60, coeff_a, 2)
        vcf = _vcf_from_lambda(341.0957 / rho_star ** 2, temperature_f)
        return vcf, "6A – Crudo / Condensado"

    if table_up == "6B":
        k0, k1, k2, group = _constants_table_6b(rho_60)
        coeff_a = (delta_60 / 2) * (((k0 / rho_60 + k1) / rho_60) + k2)
        coeff_b = ((2 * k0) + k1 * rho_60) / (k0 + (k1 + k2 * rho_60) * rho_60)
        rho_star = _rho_star(rho_60, coeff_a, coeff_b)
        lambda_value = k0 / rho_star ** 2 + k1 / rho_star + k2
        vcf = _vcf_from_lambda(lambda_value, temperature_f)
        return vcf, group

    if table_up == "6C":
        # Lambda fijo = 0.000789 para MTBE, mezclas con etanol y zona de transición especial.
        # Fuente: API MPMS 11.1 (2004), F.C.V._A-B-C-D_desbloqueado.xlsx hoja "Fórmula Tabla 6C".
        vcf = _vcf_from_lambda(0.000789, temperature_f)
        return vcf, "6C – MTBE / Mezclas especiales"

    if table_up == "6D":
        # λ = 0.34878 / ρ*   (aceites lubricantes)
        lambda_60 = 0.34878 / rho_60
        coeff_a = (delta_60 / 2) * lambda_60
        rho_star = _rho_star(rho_60, coeff_a, 1)
        vcf = _vcf_from_lambda(0.34878 / rho_star, temperature_f)
        return vcf, "6D – Aceites lubricantes"

    raise ValueError(f"Tabla VCF inválida: '{table}'. Use 6A, 6B, 6C o 6D.")


def calculate_vcf_all_tables(api_gravity: float, temperature_f: float) -> dict:
    """Calcula VCF para las 4 tablas simultáneamente (vista comparativa).

    Equivale a la hoja 'VCF (2.004)' del archivo F.C.V._A-B-C-D_desbloqueado.xlsx.
    Útil para cross-check y selección de tabla en campo.
    """
    results = {}
    for tbl in ("6A", "6B", "6C", "6D"):
        try:
            vcf, group = calculate_vcf_full(api_gravity, temperature_f, tbl)
            results[tbl] = {"vcf": vcf, "group": group, "ok": True}
        except ValueError as exc:
            results[tbl] = {"vcf": None, "group": str(exc), "ok": False}
    return results


def calculate_quantity(
    gov_bbl: float,
    api_gravity: float,
    temperature_f: float,
    bsw_pct: float,
    vef: float = 1.0,
    table: str = "6B",
    apply_vef: bool = False,
) -> QuantityResult:
    """Calcula GSV, NSV, m3, toneladas en aire y al vacio.

    Para buques, VEF se aplica dividiendo GSV / VEF (API MPMS 17.1).
    Para tierra, ``apply_vef`` debe ser False.
    """
    vcf, product_group = calculate_vcf_full(api_gravity, temperature_f, table)
    gsv = gov_bbl * vcf
    if apply_vef:
        if vef <= 0:
            raise ValueError("El VEF debe ser mayor que cero.")
        gsv /= vef
    nsv = gsv * (1.0 - bsw_pct / 100.0)

    density_kgm3 = density_60f_from_api(api_gravity)  # kg/m3, ref 60°F ≈ 15°C
    density_sg = density_kgm3 / KG_M3_WATER_60F        # gravedad especifica (≈ t/m3)

    gsv_m3 = gsv * BBL_TO_M3
    nsv_m3 = nsv * BBL_TO_M3

    # Peso al vacio: NSV (m3) × densidad (t/m3)
    metric_tons_vacuum = nsv_m3 * density_kgm3 / 1000.0

    # Correccion de flotabilidad en aire: ASTM D 1250 / API MPMS 11.5.3
    # Factor = 1 - (1.1 / densidad_kg_m3)
    buoyancy_correction = 1.1 / density_kgm3 if density_kgm3 > 0 else 0.0
    metric_tons_air = metric_tons_vacuum * (1.0 - buoyancy_correction)

    return QuantityResult(
        gov_bbl=gov_bbl,
        gsv_bbl=gsv,
        nsv_bbl=nsv,
        gsv_m3_15c=gsv_m3,
        nsv_m3_15c=nsv_m3,
        metric_tons_air=metric_tons_air,
        metric_tons_vacuum=metric_tons_vacuum,
        density_15c=density_sg,
        density_15c_kgm3=density_kgm3,
        api=api_gravity,
        bsw_pct=bsw_pct,
        vcf=vcf,
        vef=vef if apply_vef else 1.0,
        vcf_table=table.upper(),
        product_group=product_group,
    )


def difference(first: float, second: float) -> dict:
    """Diferencia absoluta y porcentual (segundo menos primero)."""
    delta = second - first
    percentage = (delta / first * 100.0) if first else 0.0
    return {"difference": delta, "percentage": percentage}


def calculate_ullage_phase(
    tanks: list[dict],
    phase: str,
    vef: float,
    table: str,
) -> dict:
    """Consolida una medicion estatica de ullage tanque por tanque.

    Secuencia: TOV (tabla de aforo) → GOV (TOV − agua libre) → GSV (GOV × VCF) → NSV.
    Conforme API MPMS 12.1.1 estatico y API MPMS 11.1 para VCF.
    API ponderada por GSV.
    """
    totals: dict = {
        "tov_bbl": 0.0,
        "free_water_bbl": 0.0,
        "gov_bbl": 0.0,
        "gsv_bbl": 0.0,
        "nsv_bbl": 0.0,
        "gsv_m3_15c": 0.0,
        "nsv_m3_15c": 0.0,
        "metric_tons_air": 0.0,
        "metric_tons_vacuum": 0.0,
        "weighted_api": 0.0,
        "weighted_density": 0.0,
        "active_tanks": 0,
        "tanks": [],
    }
    for tank in tanks:
        tov = float(tank.get(f"{phase}_tov_bbl", 0) or 0)
        free_water = float(tank.get(f"{phase}_free_water_bbl", 0) or 0)
        if tov <= 0 and free_water <= 0:
            continue
        temperature = float(tank.get(f"{phase}_temperature_f", 60) or 60)
        api_gravity = float(tank.get(f"{phase}_api", 35) or 35)
        bsw_pct = float(tank.get(f"{phase}_bsw_pct", 0) or 0)
        gov = max(tov - free_water, 0)
        quantity = calculate_quantity(gov, api_gravity, temperature, bsw_pct, vef, table, True)
        tank_result = {
            "name": tank.get("name", ""),
            "reference_height": tank.get("reference_height", 0),
            "ullage": tank.get(f"{phase}_ullage", 0),
            "tov_bbl": tov,
            "free_water_bbl": free_water,
            **quantity.to_dict(),
        }
        totals["tanks"].append(tank_result)
        totals["active_tanks"] += 1
        totals["tov_bbl"] += tov
        totals["free_water_bbl"] += free_water
        totals["gov_bbl"] += quantity.gov_bbl
        totals["gsv_bbl"] += quantity.gsv_bbl
        totals["nsv_bbl"] += quantity.nsv_bbl
        totals["gsv_m3_15c"] += quantity.gsv_m3_15c
        totals["nsv_m3_15c"] += quantity.nsv_m3_15c
        totals["metric_tons_air"] += quantity.metric_tons_air
        totals["metric_tons_vacuum"] += quantity.metric_tons_vacuum
        totals["weighted_api"] += api_gravity * quantity.gsv_bbl
        totals["weighted_density"] += quantity.density_15c_kgm3 * quantity.gsv_bbl

    gsv = totals["gsv_bbl"]
    totals["api"] = totals["weighted_api"] / gsv if gsv else 0.0
    totals["density_15c_kgm3"] = totals["weighted_density"] / gsv if gsv else 0.0
    totals["density_15c"] = totals["density_15c_kgm3"] / KG_M3_WATER_60F if gsv else 0.0
    totals["vef"] = vef
    # Grupo de producto del primer tanque activo (todos comparten tabla)
    totals["product_group"] = totals["tanks"][0].get("product_group", "") if totals["tanks"] else ""
    totals["vcf_table"] = table.upper()
    return totals


def calculate_ullage_difference(initial: dict, final: dict) -> dict:
    """Cantidad descargada = medicion inicial menos final."""
    keys = [
        "tov_bbl", "free_water_bbl", "gov_bbl", "gsv_bbl", "nsv_bbl",
        "gsv_m3_15c", "nsv_m3_15c", "metric_tons_air", "metric_tons_vacuum",
    ]
    result = {key: float(initial.get(key, 0)) - float(final.get(key, 0)) for key in keys}
    result["api"] = initial.get("api", 0) or final.get("api", 0)
    result["density_15c"] = initial.get("density_15c", 0) or final.get("density_15c", 0)
    result["density_15c_kgm3"] = initial.get("density_15c_kgm3", 0) or final.get("density_15c_kgm3", 0)
    result["vef"] = initial.get("vef", 1)
    return result
