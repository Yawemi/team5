const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000; // порт, который использует ваш фронтенд

app.use(cors()); // разрешить кросс-доменные запросы
app.use(bodyParser.json()); // парсить JSON тела запросов

// Временное хранилище сертификатов (замените на базу данных)
let certificates = [];
let certificateIdCounter = 1;

// Маршрут для получения списка сертификатов
app.get('/api/certificates', (req, res) => {
  res.json(certificates);
});

// Маршрут для выпуска нового сертификата
app.post('/api/certificates', (req, res) => {
  const { subject, issuer } = req.body;
  const newCert = {
    id: certificateIdCounter++,
    subject,
    issuer,
    status: 'valid', // или revoked
    issuedAt: new Date(),
  };
  certificates.push(newCert);
  res.json({ message: 'Сертификат выпущен', certificate: newCert });
});

// Маршрут для отзыва сертификата
app.post('/api/certificates/:id/revoke', (req, res) => {
  const { id } = req.params;
  const cert = certificates.find(c => c.id === parseInt(id));
  if (cert) {
    cert.status = 'revoked';
    res.json({ message: 'Сертификат отозван', certificate: cert });
  } else {
    res.status(404).json({ error: 'Сертификат не найден' });
  }
});

// Маршрут для проверки статуса OCSP (заглушка)
app.get('/api/ocsp/:serialNumber', (req, res) => {
  const { serialNumber } = req.params;
  // В реальности нужно проверить статус через OCSP протокол
  // Здесь просто возвращаем "valid" или "revoked" случайным образом
  const status = Math.random() > 0.5 ? 'good' : 'revoked';
  res.json({ serialNumber, status });
});

// Маршрут для получения статистики (заглушка)
app.get('/api/statistics', (req, res) => {
  const total = certificates.length;
  const validCount = certificates.filter(c => c.status === 'valid').length;
  const revokedCount = certificates.filter(c => c.status === 'revoked').length;
  
  res.json({
    totalCertificates: total,
    validCertificates: validCount,
    revokedCertificates: revokedCount,
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
app.post('/api/certificates/issue', (req, res) => {
  // Ваша логика выпуска сертификата
  res.json({ message: 'Сертификат успешно выпущен' });
});
