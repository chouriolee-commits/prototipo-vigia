import httpx


async def test_fuente_activa_video(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/vision/fuente-activa")
    assert resp.status_code == 200
    body = resp.json()
    assert body["tipo"] in {"video", "image", "directory"}
    assert body["url_media"].startswith("/media/")
    if body["tipo"] != "directory":
        assert body["nombre"]


async def test_media_sirve_archivo_existente(client: httpx.AsyncClient) -> None:
    resp = await client.get("/media/DESCARGAR_VIDEO.md")
    assert resp.status_code == 200
    assert "yt-dlp" in resp.text


async def test_media_archivo_inexistente_404(client: httpx.AsyncClient) -> None:
    resp = await client.get("/media/no_existe.mp4")
    assert resp.status_code == 404


async def test_media_bloquea_path_traversal(client: httpx.AsyncClient) -> None:
    resp = await client.get("/media/../../etc/passwd")
    assert resp.status_code == 404