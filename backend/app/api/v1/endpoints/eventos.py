from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.evento import Evento
from app.db.session import get_db
from app.schemas.evento import EventoIngestResponse, EventoRead, EventoStats
from app.schemas.vision import EventoDeteccion
from app.services.ingesta_service import procesar_evento

router = APIRouter()

# POST /eventos/ingest está EXENTO de autenticación (spec-02 §7):
# lo consume el módulo de visión. Se registra como router aparte.
ingest_router = APIRouter()


@ingest_router.post(
    "/ingest", response_model=EventoIngestResponse, status_code=status.HTTP_201_CREATED
)
async def ingestar_evento(
    payload: EventoDeteccion,
    session: AsyncSession = Depends(get_db),
) -> EventoIngestResponse:
    return await procesar_evento(session, payload)


@router.get("/stats", response_model=EventoStats)
async def stats_eventos(session: AsyncSession = Depends(get_db)) -> EventoStats:
    desde = func.date_sub(func.now(), text("INTERVAL 24 HOUR"))

    total = await session.scalar(
        select(func.count(Evento.id)).where(Evento.timestamp_evento >= desde)
    )
    por_tipo = dict(
        (await session.execute(
            select(Evento.tipo, func.count(Evento.id))
            .where(Evento.timestamp_evento >= desde)
            .group_by(Evento.tipo)
        )).all()
    )
    por_nivel = dict(
        (await session.execute(
            select(Evento.nivel_relevancia, func.count(Evento.id))
            .where(Evento.timestamp_evento >= desde)
            .group_by(Evento.nivel_relevancia)
        )).all()
    )
    return EventoStats(
        total_eventos=total or 0,
        por_tipo=por_tipo,
        por_nivel=por_nivel,
    )


@router.get("", response_model=list[EventoRead])
async def listar_eventos(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    desde: datetime | None = None,
    hasta: datetime | None = None,
    session: AsyncSession = Depends(get_db),
) -> list[Evento]:
    stmt = select(Evento).order_by(Evento.timestamp_evento.desc())
    if desde is not None:
        stmt = stmt.where(Evento.timestamp_evento >= desde)
    if hasta is not None:
        stmt = stmt.where(Evento.timestamp_evento <= hasta)
    stmt = stmt.limit(limit).offset(offset)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/{evento_id}", response_model=EventoRead)
async def obtener_evento(
    evento_id: int,
    session: AsyncSession = Depends(get_db),
) -> Evento:
    evento = await session.get(Evento, evento_id)
    if evento is None:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return evento