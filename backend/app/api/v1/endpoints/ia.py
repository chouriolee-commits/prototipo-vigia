from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.alerta import Alerta
from app.db.models.animal import Animal
from app.db.models.evento import Evento
from app.db.session import get_db
from app.schemas.alerta import AnalisisIA
from app.schemas.ia import AnalizarRequest
from app.services.ia_client import analizar_alerta, construir_solicitud

router = APIRouter()


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


@router.post("/analizar", response_model=AnalisisIA)
async def analizar_alerta_manual(
    payload: AnalizarRequest,
    session: AsyncSession = Depends(get_db),
) -> AnalisisIA:
    alerta = await session.get(Alerta, payload.alerta_id)
    if alerta is None:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    evento = await session.get(Evento, alerta.evento_id)
    total, especie = await _contexto_hato(session)
    solicitud = construir_solicitud(alerta, evento, total, especie)

    respuesta = await analizar_alerta(solicitud)
    if respuesta is None:
        raise HTTPException(status_code=502, detail="Agente IA no disponible")

    try:
        analisis = AnalisisIA.model_validate(respuesta)
    except Exception:
        alerta.analisis_ia = respuesta
        await session.commit()
        raise HTTPException(status_code=502, detail="Respuesta del agente IA inválida")

    alerta.analisis_ia = analisis.model_dump(mode="json")
    await session.commit()
    return analisis