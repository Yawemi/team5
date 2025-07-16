import React from 'react';
import CertificateList from './components/CertificateList';
import IssueCertificateForm from './components/IssueCertificateForm';
import RevokeCertificateForm from './components/RevokeCertificateForm';
import OCSPChecker from './components/OCSPChecker';
import CertificateStats from './components/CertificateStats';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Центр сертификации (PKI)</h1>

      <section style={{ marginBottom: '30px' }}>
        <h2>Выпуск сертификата</h2>
        <IssueCertificateForm />
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Список сертификатов</h2>
        <CertificateList />
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Отзыв сертификата</h2>
        <RevokeCertificateForm />
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Проверка статуса сертификата (OCSP)</h2>
        <OCSPChecker />
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Статистика</h2>
        <CertificateStats />
      </section>
    </div>
  );
}

export default App;