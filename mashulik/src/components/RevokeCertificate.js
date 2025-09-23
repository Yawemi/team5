import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RevokeCertificate = () => {
  const [certificateId, setCertificateId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!certificateId.trim()) {
      setMessage('Введите ID сертификата');
      return;
    }

    setIsLoading(true);
    setMessage('Идёт отзыв сертификата...');

    fetch('http://localhost:3001/api/revoke-certificate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ certificateId: certificateId.trim() })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Ответ сервера при отзыве:', data);

      // Проверяем наличие сообщения об успехе
      if (data.message && data.message.includes('успешно')) {
        setMessage(`Сертификат ${certificateId} успешно отозван!`);
        setCertificateId('');
      } else {
        setMessage(`Ошибка: ${data.error || 'Неизвестная ошибка сервера'}`);
      }
    })
    .catch(error => {
      console.error('Ошибка сети при отзыве:', error);
      setMessage('Ошибка сети! Убедитесь, что сервер запущен на localhost:3001');
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  return React.createElement('div', { className: 'container' }, [
    React.createElement(Link, {
      key: 'back-link',
      to: '/',
      className: 'back-button'
    }, 'Назад'),
    React.createElement('h1', { key: 'title' }, 'Отзыв сертификата'),
    React.createElement('div', {
      key: 'input-container',
      className: 'input-container'
    }, React.createElement('form', {
      onSubmit: handleSubmit,
      style: { display: 'flex', flexDirection: 'column', gap: '15px' }
    }, [
      React.createElement('input', {
        key: 'certificate-input',
        type: 'text',
        placeholder: 'ID сертификата',
        value: certificateId,
        onChange: (e) => setCertificateId(e.target.value),
        className: 'input',
        disabled: isLoading,
        required: true
      }),
      React.createElement('button', {
        key: 'submit-button',
        type: 'submit',
        className: 'button',
        disabled: isLoading,
        style: isLoading ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}
      }, isLoading ? 'Отзыв...' : 'Отозвать сертификат')
    ])),
    message && React.createElement('p', {
      key: 'message',
      style: { 
        color: message.includes('Ошибка') ? 'red' : message.includes('успешно') ? 'green' : 'blue',
        marginTop: '10px',
        fontWeight: 'bold'
      }
    }, message)
  ]);
};

export default RevokeCertificate;
