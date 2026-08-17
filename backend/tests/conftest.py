import httpx
import pytest
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import async_session
from app.main import app

_HEADERS_AUTH = {"X-API-Key": get_settings().api_key}


@pytest.fixture
async def client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://test", headers=_HEADERS_AUTH
    ) as c:
        yield c


@pytest.fixture
async def client_sin_auth() -> httpx.AsyncClient:
    """Cliente sin X-API-Key para probar las rutas exentas y el 401."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture(autouse=True)
def _mock_agente_ia(monkeypatch: pytest.MonkeyPatch) -> None:
    """Evita llamadas reales al agente IA durante los tests.

    La suite no debe depender de que el agente esté arriba ni de la API de Groq.
    """

    async def _sin_agente(solicitud: dict) -> None:
        return None

    monkeypatch.setattr("app.services.ia_client.analizar_alerta", _sin_agente)


class Limpieza:
    """Borra solo los registros creados por cada test."""

    _ORDEN = ("alertas", "eventos", "animales")

    def __init__(self) -> None:
        self.ids: dict[str, list[int]] = {}

    def registrar(self, tabla: str, id_: int) -> None:
        self.ids.setdefault(tabla, []).append(id_)

    async def ejecutar(self) -> None:
        async with async_session() as session:
            for tabla in self._ORDEN:
                ids = self.ids.get(tabla, [])
                if not ids:
                    continue
                placeholders = ", ".join(f":id_{i}" for i in range(len(ids)))
                params = {f"id_{i}": v for i, v in enumerate(ids)}
                await session.execute(
                    text(f"DELETE FROM {tabla} WHERE id IN ({placeholders})"), params
                )
            await session.commit()


@pytest.fixture
async def limpieza() -> Limpieza:
    l = Limpieza()
    yield l
    await l.ejecutar()