"""Persistencia SQLite para operaciones ACI LATAM."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


DATABASE_PATH = Path(__file__).with_name("aci_operations.db")


@contextmanager
def database() -> Iterator[sqlite3.Connection]:
    """Abre una conexion SQLite con filas accesibles por nombre."""
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    """Crea las tablas principales si aun no existen."""
    schema = """
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        client_type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS vessels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        imo TEXT,
        voyage_number TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL DEFAULT 'draft',
        current_step INTEGER NOT NULL DEFAULT 1,
        client_name TEXT,
        client_type TEXT,
        port TEXT,
        external_reference TEXT,
        aci_reference TEXT,
        vessel_name TEXT,
        voyage_number TEXT,
        imo TEXT,
        start_date TEXT,
        end_date TEXT,
        product TEXT,
        inspection_company TEXT,
        tolerance_pct REAL DEFAULT 0.25,
        vcf_table TEXT DEFAULT '6B',
        operation_mode TEXT DEFAULT 'arrival_vef',
        key_meeting TEXT,
        pumping_log TEXT,
        time_log TEXT,
        data_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS destinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        receiver_type TEXT NOT NULL,
        port TEXT,
        initial_gov_bbl REAL DEFAULT 0,
        final_gov_bbl REAL DEFAULT 0,
        temperature_f REAL DEFAULT 60,
        api REAL DEFAULT 35,
        bsw_pct REAL DEFAULT 0,
        vef REAL DEFAULT 1,
        line_adjustment_bbl REAL DEFAULT 0,
        result_json TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY(operation_id) REFERENCES operations(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS vef_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vessel_name TEXT NOT NULL,
        operation_id INTEGER,
        vef REAL NOT NULL,
        phase TEXT NOT NULL,
        recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(operation_id) REFERENCES operations(id) ON DELETE SET NULL
    );
    """
    with database() as connection:
        connection.executescript(schema)


def create_operation() -> int:
    """Crea un borrador de operacion y devuelve su identificador."""
    with database() as connection:
        cursor = connection.execute("INSERT INTO operations DEFAULT VALUES")
        return int(cursor.lastrowid)


def get_operation(operation_id: int) -> dict | None:
    """Obtiene una operacion y deserializa su bloque de datos."""
    with database() as connection:
        row = connection.execute("SELECT * FROM operations WHERE id = ?", (operation_id,)).fetchone()
    if not row:
        return None
    result = dict(row)
    result["data"] = json.loads(result.pop("data_json") or "{}")
    return result


def update_operation(operation_id: int, columns: dict, data: dict | None = None) -> None:
    """Actualiza columnas y, opcionalmente, datos calculados de una operacion."""
    payload = dict(columns)
    if data is not None:
        payload["data_json"] = json.dumps(data)
    payload["updated_at"] = "CURRENT_TIMESTAMP"
    assignments = []
    values = []
    for key, value in payload.items():
        if key == "updated_at":
            assignments.append("updated_at = CURRENT_TIMESTAMP")
        else:
            assignments.append(f"{key} = ?")
            values.append(value)
    values.append(operation_id)
    with database() as connection:
        connection.execute(f"UPDATE operations SET {', '.join(assignments)} WHERE id = ?", values)


def list_operations() -> list[dict]:
    """Lista operaciones ordenadas desde la mas reciente."""
    with database() as connection:
        rows = connection.execute("SELECT * FROM operations ORDER BY id DESC").fetchall()
    return [dict(row) for row in rows]


def register_client_and_vessel(
    client_name: str,
    client_type: str,
    vessel_name: str,
    imo: str,
    voyage_number: str,
) -> None:
    """Registra o actualiza las entidades maestras asociadas a la operacion."""
    with database() as connection:
        connection.execute(
            """INSERT INTO clients (name, client_type) VALUES (?, ?)
            ON CONFLICT(name) DO UPDATE SET client_type = excluded.client_type""",
            (client_name, client_type or "Otro"),
        )
        existing = connection.execute(
            "SELECT id FROM vessels WHERE name = ? AND COALESCE(imo, '') = ?",
            (vessel_name, imo or ""),
        ).fetchone()
        if existing:
            connection.execute(
                "UPDATE vessels SET voyage_number = ? WHERE id = ?",
                (voyage_number, existing["id"]),
            )
        else:
            connection.execute(
                "INSERT INTO vessels (name, imo, voyage_number) VALUES (?, ?, ?)",
                (vessel_name, imo, voyage_number),
            )


def replace_destinations(operation_id: int, destinations: list[dict]) -> None:
    """Reemplaza los destinos asociados a una operacion."""
    with database() as connection:
        connection.execute("DELETE FROM destinations WHERE operation_id = ?", (operation_id,))
        for destination in destinations:
            connection.execute(
                """INSERT INTO destinations (
                    operation_id, name, receiver_type, port, initial_gov_bbl,
                    final_gov_bbl, temperature_f, api, bsw_pct, vef,
                    line_adjustment_bbl, result_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    operation_id,
                    destination["name"],
                    destination["receiver_type"],
                    destination.get("port", ""),
                    destination["initial_gov_bbl"],
                    destination["final_gov_bbl"],
                    destination["temperature_f"],
                    destination["api"],
                    destination["bsw_pct"],
                    destination["vef"],
                    destination["line_adjustment_bbl"],
                    json.dumps(destination["result"]),
                ),
            )


def get_destinations(operation_id: int) -> list[dict]:
    """Devuelve los destinos de una operacion con resultados deserializados."""
    with database() as connection:
        rows = connection.execute("SELECT * FROM destinations WHERE operation_id = ? ORDER BY id", (operation_id,)).fetchall()
    destinations = []
    for row in rows:
        item = dict(row)
        item["result"] = json.loads(item.pop("result_json") or "{}")
        destinations.append(item)
    return destinations


def record_vef(operation_id: int, vessel_name: str, vef: float, phase: str) -> None:
    """Registra el VEF utilizado para trazabilidad historica."""
    if not vessel_name or vef <= 0:
        return
    with database() as connection:
        connection.execute(
            "INSERT INTO vef_history (vessel_name, operation_id, vef, phase) VALUES (?, ?, ?, ?)",
            (vessel_name, operation_id, vef, phase),
        )


def get_vef_history(vessel_name: str, limit: int = 20) -> list[dict]:
    """Devuelve el historial de VEFs para un buque, del mas reciente al mas antiguo."""
    if not vessel_name:
        return []
    with database() as connection:
        rows = connection.execute(
            """SELECT vh.*, o.aci_reference, o.port, o.product
               FROM vef_history vh
               LEFT JOIN operations o ON o.id = vh.operation_id
               WHERE vh.vessel_name = ?
               ORDER BY vh.recorded_at DESC
               LIMIT ?""",
            (vessel_name, limit),
        ).fetchall()
    return [dict(row) for row in rows]
