import React, { useState } from 'react';
import axios from 'axios';

function IssueCertificateForm() {
  const [commonName, setCommonName] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('/api/certificates/issue', { commonName, email });
      setSuccess(res.data.message);
      setError('');
    } catch (err) {
      setError('Ошибка выпуска сертификата');
      setSuccess('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input
        type="text"
        placeholder="Common Name"
        value={commonName}
        onChange={(e) => setCommonName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" style={{ padding: '8px', cursor: 'pointer' }}>Выпустить сертификат</button>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default IssueCertificateForm;