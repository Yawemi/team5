import React, { useState } from 'react';
import axios from 'axios';

function OCSPChecker() {
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    try {
      const res = await axios.get(`/api/ocsp/check?serial=${serialNumber}`);
      setStatus(res.data.status);
      setError('');
    } catch (err) {
      setError('Ошибка проверки статуса');
      setStatus(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input
        type="text"
        placeholder="Серийный номер"
        value={serialNumber}
        onChange={(e) => setSerialNumber(e.target.value)}
        required
      />
      <button onClick={checkStatus} style={{ padding: '8px', cursor: 'pointer' }}>Проверить статус</button>
      {status && <p>Статус: <strong>{status}</strong></p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default OCSPChecker;