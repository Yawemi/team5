import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CheckStatus = () => {
  const [certificateId, setCertificateId] = useState('');
  const [status, setStatus] = useState('');

  const checkStatus = () => {
    if (certificateId === '123') {
      setStatus('Активен');
    } else {
      setStatus('Не найден');
    }
  };

  return (
    <div className="container">
      <Link to="/" className="back-button">Назад</Link>
      <h1>Проверка статуса сертификата (OCSP)</h1>
      <div className="check-container">
        <input
          type="text"
          placeholder="ID сертификата"
          value={certificateId}
          onChange={(e) => setCertificateId(e.target.value)}
          className="check-input"
        />
        <button onClick={checkStatus} className="check-button">Проверить статус</button>
        {status && <p className="status-message">Статус: {status}</p>}
      </div>
    </div>
  );
};

export default CheckStatus;