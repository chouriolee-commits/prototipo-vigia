from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.animal import Animal
from app.db.session import get_db
from app.schemas.animal import AnimalCreate, AnimalRead, AnimalUpdate

router = APIRouter()


@router.get("", response_model=list[AnimalRead])
async def listar_animales(
    activos: bool = True,
    session: AsyncSession = Depends(get_db),
) -> list[Animal]:
    stmt = select(Animal).where(Animal.activo == activos).order_by(Animal.id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/{animal_id}", response_model=AnimalRead)
async def obtener_animal(
    animal_id: int,
    session: AsyncSession = Depends(get_db),
) -> Animal:
    animal = await session.get(Animal, animal_id)
    if animal is None:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return animal


@router.post("", response_model=AnimalRead, status_code=status.HTTP_201_CREATED)
async def crear_animal(
    payload: AnimalCreate,
    session: AsyncSession = Depends(get_db),
) -> Animal:
    animal = Animal(**payload.model_dump())
    session.add(animal)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=409, detail="Ya existe un animal con ese identificador"
        )
    await session.refresh(animal)
    return animal


@router.put("/{animal_id}", response_model=AnimalRead)
async def actualizar_animal(
    animal_id: int,
    payload: AnimalUpdate,
    session: AsyncSession = Depends(get_db),
) -> Animal:
    animal = await session.get(Animal, animal_id)
    if animal is None:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(animal, campo, valor)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=409, detail="Ya existe un animal con ese identificador"
        )
    await session.refresh(animal)
    return animal


@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def desactivar_animal(
    animal_id: int,
    session: AsyncSession = Depends(get_db),
) -> Response:
    animal = await session.get(Animal, animal_id)
    if animal is None:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    animal.activo = False
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)