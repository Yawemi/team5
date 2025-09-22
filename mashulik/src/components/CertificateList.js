import React from 'react';
import { Link } from 'react-router-dom';

const CertificateList = () => {
  const certificates = [
    { id: 1, name: 'Сертификат 1', status: 'Активен' },
    { id: 2, name: 'Сертификат 2', status: 'Отозван' },
  ];

  return (
    <div className="container">
      <Link to="/" className="back-button">Назад</Link>
      <h1>Список сертификатов</h1>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => (
              <tr key={cert.id}>
                <td>{cert.id}</td>
                <td>{cert.name}</td>
                <td>{cert.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CertificateList;