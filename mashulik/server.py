from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from datetime import datetime, timedelta
import json
import os
import secrets
import re
from typing import List, Optional
import uvicorn

app = FastAPI(
    title="Certificate Authority API",
    description="API для управления SSL сертификатами",
    version="1.0.0"
)

# Настройка CORS для React приложения
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных для запросов
class CertificateRequest(BaseModel):
    name: str
    email: str  # Простая строка вместо EmailStr

class RevokeRequest(BaseModel):
    certificateId: str

# Конфигурация
DB_FILE = "certificates.json"
CERT_VALIDITY_DAYS = 365

def validate_email(email: str) -> bool:
    """Простая валидация email"""
    if not email or '@' not in email:
        return False
    return True

def load_certificates() -> dict:
    """Загрузка сертификатов из JSON файла"""
    try:
        if os.path.exists(DB_FILE):
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Ошибка загрузки БД: {e}")
    
    return {"certificates": []}

def save_certificates(data: dict):
    """Сохранение сертификатов в JSON файл"""
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    except Exception as e:
        print(f"Ошибка сохранения БД: {e}")
        raise

def generate_certificate_id() -> str:
    """Генерация уникального ID для сертификата"""
    return secrets.token_hex(4).upper()

def create_self_signed_certificate(name: str, email: str):
    """Создание самоподписанного SSL сертификата"""
    # Генерация RSA ключевой пары
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    # Создание subject и issuer
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, name),
        x509.NameAttribute(NameOID.EMAIL_ADDRESS, email),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Certificate Authority"),
        x509.NameAttribute(NameOID.COUNTRY_NAME, "RU"),
    ])

    # Создание сертификата
    certificate = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.utcnow()
    ).not_valid_after(
        datetime.utcnow() + timedelta(days=CERT_VALIDITY_DAYS)
    ).add_extension(
        x509.BasicConstraints(ca=False, path_length=None), critical=True,
    ).sign(private_key, hashes.SHA256())

    return certificate, private_key

@app.get("/")
async def root():
    """Корневой endpoint"""
    return {
        "message": "Сервер управления сертификатами запущен!",
        "endpoints": {
            "generate": "POST /api/generate-certificate",
            "revoke": "POST /api/revoke-certificate", 
            "check_status": "GET /api/check-status/{id}",
            "list_certificates": "GET /api/certificates",
            "server_info": "GET /api/server-info"
        }
    }

@app.get("/api/server-info")
async def server_info():
    """Информация о сервере"""
    db = load_certificates()
    stats = {
        "active": len([c for c in db["certificates"] if c["status"] == "active"]),
        "revoked": len([c for c in db["certificates"] if c["status"] == "revoked"]),
        "total": len(db["certificates"])
    }
    
    return {
        "server": "Python Certificate Authority",
        "version": "1.0.0",
        "status": "running",
        "certificates": stats
    }

@app.post("/api/generate-certificate")
async def generate_certificate(request: CertificateRequest):
    """Генерация нового SSL сертификата"""
    try:
        print(f"🔐 Запрос на генерацию сертификата для: {request.name} ({request.email})")
        
        # Базовая валидация
        if not request.name.strip():
            raise HTTPException(status_code=400, detail="Имя не может быть пустым")
        
        if not request.email.strip():
            raise HTTPException(status_code=400, detail="Email не может быть пустым")
        
        if not validate_email(request.email):
            raise HTTPException(status_code=400, detail="Неверный формат email")
        
        # Создание сертификата
        certificate, private_key = create_self_signed_certificate(request.name, request.email)
        
        # Конвертация в PEM формат
        certificate_pem = certificate.public_bytes(serialization.Encoding.PEM).decode('utf-8')
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        # Подготовка записи для БД
        cert_id = generate_certificate_id()
        certificate_record = {
            "id": cert_id,
            "commonName": request.name,
            "email": request.email,
            "status": "active",
            "serialNumber": str(certificate.serial_number),
            "issuedAt": datetime.utcnow().isoformat(),
            "expiresAt": (datetime.utcnow() + timedelta(days=CERT_VALIDITY_DAYS)).isoformat(),
            "revokedAt": None
        }

        # Сохранение в БД
        db = load_certificates()
        db["certificates"].append(certificate_record)
        save_certificates(db)

        print(f"✅ Сертификат создан: ID {cert_id}")
        
        return {
            "success": True,
            "message": "Сертификат успешно создан!",
            "certificate": certificate_pem,
            "privateKey": private_key_pem,
            "id": cert_id
        }

    except Exception as e:
        print(f"❌ Ошибка генерации сертификата: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка генерации сертификата: {str(e)}")

@app.post("/api/revoke-certificate")
async def revoke_certificate(request: RevokeRequest):
    """Отзыв сертификата"""
    try:
        print(f"🚫 Запрос на отзыв сертификата: {request.certificateId}")
        
        db = load_certificates()
        certificate = None
        cert_index = -1
        
        # Поиск сертификата
        for i, cert in enumerate(db["certificates"]):
            if cert["id"] == request.certificateId:
                certificate = cert
                cert_index = i
                break
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Сертификат не найден")
        
        if certificate["status"] == "revoked":
            raise HTTPException(status_code=400, detail="Сертификат уже отозван")
        
        # Обновление статуса
        db["certificates"][cert_index]["status"] = "revoked"
        db["certificates"][cert_index]["revokedAt"] = datetime.utcnow().isoformat()
        save_certificates(db)
        
        print(f"✅ Сертификат отозван: {request.certificateId}")
        
        return {
            "success": True,
            "message": f"Сертификат {request.certificateId} успешно отозван"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Ошибка отзыва сертификата: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка отзыва сертификата: {str(e)}")

@app.get("/api/check-status/{certificate_id}")
async def check_status(certificate_id: str):
    """Проверка статуса сертификата"""
    try:
        print(f"🔍 Проверка статуса сертификата: {certificate_id}")
        
        db = load_certificates()
        
        for certificate in db["certificates"]:
            if certificate["id"] == certificate_id:
                print(f"✅ Сертификат найден: {certificate['commonName']}")
                return {
                    "success": True,
                    **certificate
                }
        
        print(f"❌ Сертификат не найден: {certificate_id}")
        raise HTTPException(status_code=404, detail="Сертификат не найден")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Ошибка проверки статуса: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка проверки статуса: {str(e)}")

@app.get("/api/certificates")
async def get_certificates():
    """Получение списка всех сертификатов"""
    try:
        print("📋 Запрос списка сертификатов")
        
        db = load_certificates()
        certificates = db["certificates"]
        
        # Статистика
        active_count = len([c for c in certificates if c["status"] == "active"])
        revoked_count = len([c for c in certificates if c["status"] == "revoked"])
        
        return {
            "success": True,
            "list": certificates,
            "stats": {
                "active": active_count,
                "revoked": revoked_count,
                "total": len(certificates)
            }
        }

    except Exception as e:
        print(f"❌ Ошибка получения списка сертификатов: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка: {str(e)}")

# Обработчики ошибок
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"💥 Необработанная ошибка: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Внутренняя ошибка сервера"}
    )

if __name__ == "__main__":
    print("🚀 Запуск Python сервера управления сертификатами...")
    print("📍 Адрес: http://localhost:3001")
    print("📚 Документация: http://localhost:3001/docs")
    print("=" * 50)
    
    # Создаем файл БД если его нет
    if not os.path.exists(DB_FILE):
        save_certificates({"certificates": []})
        print("📁 Создана новая база данных сертификатов")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=3001,
        log_level="info"
    )