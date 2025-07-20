from fastapi import APIRouter

router = APIRouter()

@router.get("/api/statistics")
async def get_statistics():
    return {
        "statistics": {
            "total_certificates": 100,
            "active_certificates": 80,
            "revoked_certificates": 20
        }
    }