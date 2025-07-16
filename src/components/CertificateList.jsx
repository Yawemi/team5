import React, { useEffect, useState } from 'react';
import axios from 'axios';

function CertificateList() {
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const res = await axios.get('/api/certificates');
        setCertificates(res.data);
      } catch (err) {
        console.error('Ошибка загрузки сертификатов');
      }
    };
    fetchCerts();
  }, []);

  return (
    <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Common Name</th>
          <th>Email</th>
          <th>Срок действия</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        {certificates.map((cert) => (
          <tr key={cert.serialNumber}>
            <td>{cert.commonName}</td>
            <td>{cert.email}</td>
            <td>{new Date(cert.expiresAt).toLocaleDateString()}</td>
            <td>{cert.revoked ? 'Отозван' : 'Активен'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default CertificateList;