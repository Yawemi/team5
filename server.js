const express = require('express');
const cors = require('cors');
const forge = require('node-forge');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Разрешаем запросы с любого origin (для разработки)
app.use(express.json()); // Позволяем серверу парсить JSON

// Файл нашей "базы данных"
const dbPath = path.join(__dirname, 'certificates.json');

// Вспомогательная функция для работы с "БД"
async function readDB() {
  try {
    const data = await fs.readJson(dbPath);
    return data;
  } catch (error) {
    // Если файла нет, возвращаем пустой массив
    return { certificates: [] };
  }
}

async function writeDB(data) {
  await fs.writeJson(dbPath, data, { spaces: 2 });
}

// Генерация уникального ID для сертификата
function generateID() {
  return Math.random().toString(36).substring(2, 10).toUpperCase(); // Короткий ID, например, "A1B2C3D4"
}

// 1. Эндпоинт для выдачи сертификата
app.post('/api/generate-certificate', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Имя и email обязательны' });
  }

  try {
    // Генерируем ключевую пару
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

    // Создаём сертификат
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01' + generateID(); // Серийный номер
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1); // Действителен 1 год

    // Атрибуты владельца и издателя (self-signed)
    const attributes = [
      { name: 'commonName', value: name },
      { name: 'emailAddress', value: email }
    ];
    const issuer = attributes; // Так как сертификат самоподписанный, issuer = subject

    cert.setSubject(attributes);
    cert.setIssuer(issuer);

    // Подписываем сертификат своим же приватным ключом
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // Конвертируем в PEM格式
    const certificatePem = forge.pki.certificateToPem(cert);

    // Генерируем ID для записи в БД
    const certId = generateID();

    // Подготавливаем запись о сертификате
    const certificateRecord = {
      id: certId,
      commonName: name,
      email: email,
      status: 'active', // Изначально активен
      serialNumber: cert.serialNumber,
      issuedAt: new Date().toISOString(),
      expiresAt: cert.validity.notAfter.toISOString(),
      // Здесь можно сохранить PEM в файлы, если нужно:
      // privateKey: privateKeyPem,
      // certificate: certificatePem
    };

    // Сохраняем запись в БД
    const db = await readDB();
    db.certificates.push(certificateRecord);
    await writeDB(db);

    // Отправляем ответ клиенту
    res.json({
      message: 'Сертификат успешно создан!',
      certificate: certificatePem,
      privateKey: privateKeyPem, // Осторожно! В продакшене приватный ключ так просто не отдают.
      id: certId // Отправляем ID клиенту для сохранения
    });

  } catch (error) {
    console.error('Ошибка генерации сертификата:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// 2. Эндпоинт для отзыва сертификата
app.post('/api/revoke-certificate', async (req, res) => {
  const { certificateId } = req.body;

  if (!certificateId) {
    return res.status(400).json({ error: 'ID сертификата обязателен' });
  }

  try {
    const db = await readDB();
    const certIndex = db.certificates.findIndex(cert => cert.id === certificateId);

    if (certIndex === -1) {
      return res.status(404).json({ error: 'Сертификат не найден' });
    }

    // Меняем статус на "отозван"
    db.certificates[certIndex].status = 'revoked';
    db.certificates[certIndex].revokedAt = new Date().toISOString();

    await writeDB(db);

    res.json({ message: `Сертификат ${certificateId} успешно отозван.` });

  } catch (error) {
    console.error('Ошибка отзыва сертификата:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// 3. Эндпоинт для проверки статуса сертификата
app.get('/api/check-status/:certificateId', async (req, res) => {
  const { certificateId } = req.params;

  try {
    const db = await readDB();
    const certificate = db.certificates.find(cert => cert.id === certificateId);

    if (!certificate) {
      return res.status(404).json({ error: 'Сертификат не найден' });
    }

    // Возвращаем всю информацию о сертификате, включая статус
    res.json(certificate);

  } catch (error) {
    console.error('Ошибка проверки статуса:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// 4. Эндпоинт для получения списка всех сертификатов и статистики
app.get('/api/certificates', async (req, res) => {
  try {
    const db = await readDB();

    // Считаем статистику
    const active = db.certificates.filter(c => c.status === 'active').length;
    const revoked = db.certificates.filter(c => c.status === 'revoked').length;

    // Отправляем и список, и статистику
    res.json({
      list: db.certificates,
      stats: { active, revoked, total: active + revoked }
    });

  } catch (error) {
    console.error('Ошибка получения списка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  // Инициализируем файл БД при первом запуске, если его нет
  readDB().then(() => console.log('Готов к работе!'));
});
