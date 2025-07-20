from fastapi import APIRouter

router = APIRouter()

@router.get("/api/certificates")
async def get_certificates():
    return {
        "certificates": [
            {"id": 1, "name": "Certificate A", "status": "valid"},
            {"id": 2, "name": "Certificate B", "status": "revoked"}
        ]
    }