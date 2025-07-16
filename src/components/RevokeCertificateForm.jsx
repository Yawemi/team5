import React, { useState } from 'react';
import axios from 'axios';

function RevokeCertificateForm() {
  const [serialNumber, setSerialNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('/api/certificates/revoke', { serialNumber });
      setMessage(res.data.message);
      setError('');
    } catch (err) {
      setError('Ошибка отзыва сертификата');
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input
        type="text"
        placeholder="Серийный номер"
        value={serialNumber}
        onChange={(e) => setSerialNumber(e.target.value)}
        required
      />
      <button type="submit" style={{ padding: '8px', cursor: 'pointer' }}>Отозвать</button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default RevokeCertificateForm;