import pytest
from pydantic import ValidationError

from app.schemas.animal import AnimalCreate
from app.schemas.alerta import AnalisisIA
from app.schemas.evento import EventoCreate


def test_animal_create_valido() -> None:
    animal = AnimalCreate(
        identificador="VAC-001",
        especie="bovino",
        sexo="hembra",
        fecha_registro="2026-08-01",
    )
    assert animal.especie == "bovino"
    assert animal.sexo == "hembra"


def test_animal_especie_invalida_rechazada() -> None:
    with pytest.raises(ValidationError):
        AnimalCreate(
            identificador="VAC-002",
            especie="dinosaurio",
            fecha_registro="2026-08-01",
        )


def test_animal_identificador_vacio_rechazado() -> None:
    with pytest.raises(ValidationError):
        AnimalCreate(
            identificador="",
            especie="bovino",
            fecha_registro="2026-08-01",
        )


def test_evento_create_sin_animal_ok() -> None:
    evento = EventoCreate(
        tipo="deteccion",
        timestamp_evento="2026-08-16T10:30:00Z",
    )
    assert evento.nivel_relevancia == "normal"


def test_analisis_ia_contrato_spec() -> None:
    analisis = AnalisisIA(
        alerta_id=55,
        resumen="Se observa un patrón de separación del grupo.",
        nivel_urgencia="media",
        justificacion="El comportamiento es consistente con malestar.",
        recomendacion="Verificar estado del animal.",
        disclaimer="Este análisis es apoyo. No constituye diagnóstico veterinario.",
        modelo_usado="llama-3.1-8b-instant",
        timestamp="2026-08-16T10:30:08Z",
    )
    assert analisis.alerta_id == 55
    assert "No constituye diagnóstico" in analisis.disclaimer