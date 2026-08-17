from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.alerta import Alerta
from app.db.session import get_db
from app.schemas.alerta import AlertaEstadoUpdate, AlertaRead

router = APIRouter()


@router.get("", response_model=list[AlertaRead])
async def listar_alertas(
    estado: str | None = Query(default=None),
    nivel: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_db),
) -> list[Alerta]:
    stmt = select(Alerta).order_by(Alerta.timestamp.desc())
    if estado is not None:
        stmt = stmt.where(Alerta.estado == estado)
    if nivel is not None:
        stmt = stmt.where(Alerta.nivel == nivel)
    stmt = stmt.limit(limit).offset(offset)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/{alerta_id}", response_model=AlertaRead)
async def obtener_alerta(
    alerta_id: int,
    session: AsyncSession = Depends(get_db),
) -> Alerta:
    alerta = await session.get(Alerta, alerta_id)
    if alerta is None:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return alerta


@router.put("/{alerta_id}/estado", response_model=AlertaRead)
async def actualizar_estado_alerta(
    alerta_id: int,
    payload: AlertaEstadoUpdate,
    session: AsyncSession = Depends(get_db),
) -> Alerta:
    alerta = await session.get(Alerta, alerta_id)
    if alerta is None:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alerta.estado = payload.estado
    await session.commit()
    await session.refresh(alerta)
    return alerta