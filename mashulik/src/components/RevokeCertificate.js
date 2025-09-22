import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RevokeCertificate = () => {
  const [certificateId, setCertificateId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Сертификат с ID ${certificateId} успешно отозван!`);
  };

  return (
    <div className="container">
      <Link to="/" className="back-button">Назад</Link>
      <h1>Отзыв сертификата</h1>
      <div className="input-container">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder="ID сертификата"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            className="input"
          />
          <button type="submit" className="button">Отозвать сертификат</button>
        </form>
      </div>
    </div>
  );
};

export default RevokeCertificate;