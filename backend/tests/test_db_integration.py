import pytest
from sqlalchemy import text

from app.db.session import engine


@pytest.mark.asyncio
async def test_conexion_y_tablas_existen() -> None:
    expected = {"alertas", "animales", "configuracion", "eventos"}
    async with engine.connect() as conn:
        rows = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()")
        )
        tables = {row[0] for row in rows}
    assert expected <= tables, f"Faltan tablas: {expected - tables}"


@pytest.mark.asyncio
async def test_configuracion_inicial_presente() -> None:
    expected_keys = {
        "umbral_confianza_alerta",
        "animales_minimos_hato",
        "ventana_inactividad_min",
    }
    async with engine.connect() as conn:
        rows = await conn.execute(text("SELECT clave FROM configuracion"))
        keys = {row[0] for row in rows}
    assert expected_keys <= keys, f"Faltan claves: {expected_keys - keys}"