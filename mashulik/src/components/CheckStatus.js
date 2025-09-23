import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CheckStatus = () => {
  const [certificateId, setCertificateId] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const checkStatus = (e) => {
    e.preventDefault();
    
    if (!certificateId.trim()) {
      setMessage('Введите ID сертификата');
      return;
    }

    setIsLoading(true);
    setMessage('Проверка статуса...');
    setStatus('');

    fetch(`http://localhost:3001/api/check-status/${certificateId.trim()}`)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            return response.json().then(data => {
              throw new Error(data.error || 'Сертификат не найден');
            });
          }
          throw new Error(`Ошибка сервера: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Ответ сервера:', data);
        
        if (data.id) {
          setStatus(data.status === 'active' ? 'Активен' : 'Отозван');
          setMessage(`Сертификат найден: ${data.commonName} (${data.email})`);
        } else {
          setStatus('Не найден');
          setMessage('Сертификат не найден');
        }
      })
      .catch(error => {
        console.error('Ошибка при проверке статуса:', error);
        setStatus('Ошибка');
        setMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="container">
      <Link to="/" className="back-button">Назад</Link>
      <h1>Проверка статуса сертификата (OCSP)</h1>
      <div className="check-container">
        <form onSubmit={checkStatus} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder="ID сертификата"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            className="check-input"
            disabled={isLoading}
            required
          />
          <button 
            type="submit" 
            className="check-button"
            disabled={isLoading}
          >
            {isLoading ? 'Проверка...' : 'Проверить статус'}
          </button>
        </form>
        
        {message && (
          <p className="status-message" style={{ 
            color: status === 'Активен' ? 'green' : status === 'Отозван' ? 'orange' : 'red',
            marginTop: '10px',
            fontWeight: 'bold'
          }}>
            {message}
          </p>
        )}
        
        {status && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            border: '1px solid #ccc', 
            borderRadius: '5px',
            backgroundColor: status === 'Активен' ? '#f0fff0' : status === 'Отозван' ? '#fffaf0' : '#fff0f0'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              Статус: <span style={{ 
                color: status === 'Активен' ? 'green' : status === 'Отозван' ? 'orange' : 'red'
              }}>{status}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckStatus;
