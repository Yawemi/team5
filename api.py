from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import os
import json
import datetime
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

from routes.certificates import router as certificates_router
from routes.statistics import router as statistics_router

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.include_router(certificates_router)
app.include_router(statistics_router)

# Разрешить CORS для вашего фронтенда (например, localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Маршрут для получения списка сертификатов
@app.get("/api/certificates")
async def get_certificates():
    # Здесь можно вернуть реальные данные
    return {"certificates": ["cert1", "cert2"]}

# Маршрут для получения статистики
@app.get("/api/statistics")
async def get_statistics():
    # Здесь можно вернуть реальные данные
    return {"statistics": {"total": 10, "valid": 8}}

# Маршрут для выдачи сертификата (пример POST-запроса)
@app.post("/api/certificates/issue")
async def issue_certificate():
    # Логика выдачи сертификата
    return {"status": "Certificate issued successfully"}

# Пути к файлам и папкам
HSM_PATH = "hsm_storage"
CA_CERT_PATH = "ca_certificate.pem"
CA_KEY_PATH = "ca_private_key.pem"
CERTS_DIR = "certificates"
REVOKED_LIST_PATH = "revoked.json"

# Создаем необходимые папки
os.makedirs(HSM_PATH, exist_ok=True)
os.makedirs(CERTS_DIR, exist_ok=True)

# Инициализация черного списка отзывов
if not os.path.exists(REVOKED_LIST_PATH):
    with open(REVOKED_LIST_PATH, 'w') as f:
        json.dump([], f)

app = FastAPI()

# --- Вспомогательные функции ---

def create_or_load_ca():
    if os.path.exists(CA_CERT_PATH) and os.path.exists(CA_KEY_PATH):
        try:
            with open(CA_KEY_PATH, "rb") as f:
                ca_private_key = serialization.load_pem_private_key(f.read(), password=None)
            with open(CA_CERT_PATH, "rb") as f:
                ca_cert = x509.load_pem_x509_certificate(f.read())
        except Exception as e:
            print(f"Ошибка при загрузке CA: {e}")
            return None, None
    else:
        ca_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        key_bytes = ca_private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )
        with open(os.path.join(HSM_PATH, "ca_private_key.pem"), 'wb') as f:
            f.write(key_bytes)

        ca_name = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, u"RU"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"My PKI"),
            x509.NameAttribute(NameOID.COMMON_NAME, u"My Root CA"),
        ])
        ca_cert = (
            x509.CertificateBuilder()
            .subject_name(ca_name)
            .issuer_name(ca_name)
            .public_key(ca_private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.datetime.utcnow() - datetime.timedelta(days=1))
            .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=3650))
            .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
            .sign(ca_private_key, hashes.SHA256())
        )
        with open(CA_CERT_PATH, "wb") as f:
            f.write(ca_cert.public_bytes(serialization.Encoding.PEM))
    return ca_private_key, ca_cert

def issue_certificate(common_name: str):
    ca_private_key, ca_cert = create_or_load_ca()
    if not ca_private_key or not ca_cert:
        return None

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    subject = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
    ])

    now = datetime.datetime.utcnow()

    cert_builder = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(ca_cert.subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=365))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
    )

    cert = cert_builder.sign(private_key=ca_private_key, algorithm=hashes.SHA256())

    cert_path = os.path.join(CERTS_DIR, f"{common_name}_cert.pem")
    key_path = os.path.join(CERTS_DIR, f"{common_name}_key.pem")
    try:
        with open(cert_path, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        with open(key_path, "wb") as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            ))
    except Exception as e:
        print(f"Ошибка при сохранении сертификата или ключа: {e}")
        return None

    return cert_path

def revoke_certificate(cert_path: str):
    try:
        with open(cert_path, 'rb') as f:
            cert_data = f.read()
        cert = x509.load_pem_x509_certificate(cert_data)
    except Exception as e:
        print(f"Ошибка при чтении сертификата: {e}")
        return False

    try:
        with open(REVOKED_LIST_PATH, 'r+') as f:
            revoked_list = json.load(f)
            serial_str = str(cert.serial_number)
            if serial_str not in revoked_list:
                revoked_list.append(serial_str)
                f.seek(0)
                json.dump(revoked_list, f)
                f.truncate()
                return True
            else:
                return False  # Уже в списке
    except Exception as e:
        print(f"Ошибка при отзыве сертификата: {e}")
        return False
# Запросы к API
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Разрешите запросы с вашего React сайта
origins = [
    "http://localhost:5000",  # адрес React dev server
    # добавьте сюда другие адреса, если нужно
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- API модели ---

class CertRequest(BaseModel):
    common_name: str

class RevokeRequest(BaseModel):
    cert_path: str

# --- Эндпоинты ---

@app.get("/create_or_load_ca")
def api_create_or_load_ca():
    ca_private_key, ca_cert = create_or_load_ca()
    if not ca_cert or not ca_private_key:
        raise HTTPException(status_code=500, detail="Ошибка при создании или загрузке CA")
    return {"message": "CA загружен или создан"}

@app.post("/issue_certificate")
def api_issue_certificate(request: CertRequest):
    cert_path = issue_certificate(request.common_name)
    if not cert_path:
        raise HTTPException(status_code=500, detail="Ошибка при выпуске сертификата")
    return {"cert_path": cert_path}

@app.post("/revoke_certificate")
def api_revoke_certificate(request: RevokeRequest):
    success = revoke_certificate(request.cert_path)
    if not success:
        raise HTTPException(status_code=400, detail="Не удалось отозвать сертификат или он уже в списке отзывов")
    return {"message": "Сертификат отозван"}

@app.get("/check_ocsp")
def check_ocsp(serial: str = Query(...)):
    # Проверка отзыва по serial номеру
    try:
        with open(REVOKED_LIST_PATH, 'r') as f:
            revoked_list = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка чтения списка отзывов")

    status = 'revoked' if serial in revoked_list else 'good'
    return {"status": status}

# --- Запуск сервера ---

if __name__ == "__main__":
    import uvicorn
    # Запуск uvicorn сервера с этим приложением
    uvicorn.run("api:app", host="0.0.0.0", port=5000)