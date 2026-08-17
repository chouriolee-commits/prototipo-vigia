from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.alerta import Alerta
from app.db.models.animal import Animal
from app.db.models.configuracion import Configuracion
from app.db.models.evento import Evento
from app.schemas.evento import EventoIngestResponse
from app.schemas.vision import EventoDeteccion
from app.services import ia_client, n8n_client
from app.services.alerta_service import EvaluadorAlertas

_evaluador = EvaluadorAlertas()


async def _config_actual(session: AsyncSession) -> dict[str, str]:
    rows = await session.execute(select(Configuracion))
    return {row.clave: row.valor for row in rows.scalars()}


async def _contexto_hato(session: AsyncSession) -> tuple[int, str]:
    fila = await session.execute(
        select(Animal.especie, func.count(Animal.id))
        .where(Animal.activo.is_(True))
        .group_by(Animal.especie)
        .order_by(func.count(Animal.id).desc())
    )
    especies = fila.all()
    total = sum(n for _, n in especies)
    predominante = especies[0][0] if especies else "bovino"
    return total, predominante


async def procesar_evento(
    session: AsyncSession, evento: EventoDeteccion
) -> EventoIngestResponse:
    """Flujo spec-02 §5.2: persistir → evaluar reglas → alerta → IA → n8n."""
    evento_db = Evento(
        tipo="deteccion",
        descripcion=(
            f"{evento.conteo_total} animal(es) detectado(s) en {evento.fuente}"
        ),
        timestamp_evento=evento.timestamp,
        datos_raw=evento.model_dump(mode="json"),
        nivel_relevancia="normal",
        fuente=evento.fuente,
    )
    session.add(evento_db)
    await session.flush()

    config = await _config_actual(session)
    candidatas = _evaluador.evaluar(evento, config)

    alerta_generada = False
    ultima_alerta_id: int | None = None

    for candidata in candidatas:
        alerta = Alerta(
            evento_id=evento_db.id,
            tipo_alerta=candidata["tipo_alerta"],
            descripcion=candidata["descripcion"],
            nivel=candidata["nivel"],
            estado="pendiente",
            timestamp=evento.timestamp,
        )
        session.add(alerta)
        await session.flush()
        alerta_generada = True
        ultima_alerta_id = alerta.id

        total_animales, especie = await _contexto_hato(session)
        solicitud = ia_client.construir_solicitud(
            alerta, evento_db, total_animales, especie
        )
        analisis = await ia_client.analizar_alerta(solicitud)
        if analisis:
            alerta.analisis_ia = analisis

        enviado = await n8n_client.notificar_alerta(
            alerta.id, alerta.tipo_alerta, alerta.nivel, alerta.descripcion
        )
        alerta.notificado_n8n = enviado

    await session.commit()
    await session.refresh(evento_db)

    return EventoIngestResponse(
        evento_id=evento_db.id,
        alerta_generada=alerta_generada,
        alerta_id=ultima_alerta_id,
    )