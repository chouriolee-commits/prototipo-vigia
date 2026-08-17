from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.alerta import Alerta
from app.db.models.animal import Animal
from app.db.models.evento import Evento
from app.db.session import get_db
from app.schemas.dashboard import (
    ActividadHora,
    AlertaReciente,
    DashboardActividad,
    DashboardResumen,
)

router = APIRouter()


@router.get("/resumen", response_model=DashboardResumen)
async def resumen(session: AsyncSession = Depends(get_db)) -> DashboardResumen:
    animales_activos = await session.scalar(
        select(func.count(Animal.id)).where(Animal.activo == True)  # noqa: E712
    )
    eventos_hoy = await session.scalar(
        select(func.count(Evento.id)).where(
            func.date(Evento.timestamp_evento) == func.curdate()
        )
    )
    alertas_pendientes = await session.scalar(
        select(func.count(Alerta.id)).where(Alerta.estado == "pendiente")
    )
    return DashboardResumen(
        animales_activos=animales_activos or 0,
        eventos_hoy=eventos_hoy or 0,
        alertas_pendientes=alertas_pendientes or 0,
    )


@router.get("/actividad", response_model=DashboardActividad)
async def actividad(session: AsyncSession = Depends(get_db)) -> DashboardActividad:
    desde = func.date_sub(func.now(), text("INTERVAL 24 HOUR"))
    hora = func.hour(Evento.timestamp_evento)
    rows = await session.execute(
        select(hora.label("hora"), func.count(Evento.id).label("eventos"))
        .where(Evento.timestamp_evento >= desde)
        .group_by(hora)
    )
    por_hora = {row.hora: row.eventos for row in rows}
    horas = [
        ActividadHora(hora=h, eventos=por_hora.get(h, 0)) for h in range(24)
    ]
    return DashboardActividad(horas=horas)


@router.get("/alertas-recientes", response_model=list[AlertaReciente])
async def alertas_recientes(session: AsyncSession = Depends(get_db)) -> list[AlertaReciente]:
    stmt = select(Alerta).order_by(Alerta.timestamp.desc()).limit(10)
    result = await session.execute(stmt)
    return [
        AlertaReciente(
            id=a.id,
            tipo_alerta=a.tipo_alerta,
            nivel=a.nivel,
            estado=a.estado,
            timestamp=a.timestamp.isoformat(),
            descripcion=a.descripcion,
        )
        for a in result.scalars()
    ]