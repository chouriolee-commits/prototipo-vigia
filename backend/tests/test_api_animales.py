import httpx


def animal_payload(identificador: str) -> dict:
    return {
        "identificador": identificador,
        "especie": "bovino",
        "sexo": "hembra",
        "fecha_registro": "2026-08-01",
    }


async def test_crud_animal_completo(client: httpx.AsyncClient, limpieza) -> None:
    ident = "TEST-CRU-001"
    creado = await client.post("/api/v1/animales", json=animal_payload(ident))
    assert creado.status_code == 201
    animal_id = creado.json()["id"]
    assert creado.json()["activo"] is True
    limpieza.registrar("animales", animal_id)

    lista = await client.get("/api/v1/animales")
    assert lista.status_code == 200
    assert any(a["identificador"] == ident for a in lista.json())

    detalle = await client.get(f"/api/v1/animales/{animal_id}")
    assert detalle.status_code == 200
    assert detalle.json()["identificador"] == ident

    actualizado = await client.put(
        f"/api/v1/animales/{animal_id}", json={"sexo": "macho"}
    )
    assert actualizado.status_code == 200
    assert actualizado.json()["sexo"] == "macho"

    borrado = await client.delete(f"/api/v1/animales/{animal_id}")
    assert borrado.status_code == 204

    lista_activos = await client.get("/api/v1/animales")
    assert not any(a["identificador"] == ident for a in lista_activos.json())


async def test_crear_animal_identificador_duplicado_409(
    client: httpx.AsyncClient, limpieza
) -> None:
    ident = "TEST-DUP-001"
    first = await client.post("/api/v1/animales", json=animal_payload(ident))
    assert first.status_code == 201
    limpieza.registrar("animales", first.json()["id"])

    dup = await client.post("/api/v1/animales", json=animal_payload(ident))
    assert dup.status_code == 409


async def test_animal_inexistente_404(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/animales/99999999")
    assert resp.status_code == 404