import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const IssueCertificate = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      setMessage('Заполните все поля');
      return;
    }

    setIsLoading(true);
    setMessage('Идёт генерация...');

    fetch('http://localhost:3001/api/generate-certificate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Ответ сервера:', data);
      
      // Проверяем наличие ID сертификата как признак успеха
      if (data.id && data.certificate) {
        setMessage(`Успех! Сертификат создан. ID: ${data.id}`);
        setName('');
        setEmail('');
        
        // Скачивание сертификата
        const certificateBlob = new Blob([data.certificate], { type: 'application/x-pem-file' });
        const certificateUrl = URL.createObjectURL(certificateBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = certificateUrl;
        downloadLink.download = `${name}_certificate.pem`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Скачивание приватного ключа (опционально)
        if (data.privateKey) {
          const privateKeyBlob = new Blob([data.privateKey], { type: 'application/x-pem-file' });
          const privateKeyUrl = URL.createObjectURL(privateKeyBlob);
          const keyDownloadLink = document.createElement('a');
          keyDownloadLink.href = privateKeyUrl;
          keyDownloadLink.download = `${name}_private_key.pem`;
          document.body.appendChild(keyDownloadLink);
          // Задержка для последовательного скачивания
          setTimeout(() => {
            keyDownloadLink.click();
            document.body.removeChild(keyDownloadLink);
          }, 100);
        }
      } else {
        setMessage(`Ошибка: ${data.error || 'Неизвестная ошибка'}`);
      }
    })
    .catch(error => {
      console.error('Ошибка сети:', error);
      setMessage('Ошибка сети! Убедитесь, что сервер запущен');
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
    React.createElement('h1', { key: 'title' }, 'Выпуск сертификатов'),
    React.createElement('div', {
      key: 'input-container',
      className: 'input-container'
    }, React.createElement('form', {
      onSubmit: handleSubmit,
      style: { display: 'flex', flexDirection: 'column', gap: '15px' }
    }, [
      React.createElement('input', {
        key: 'name-input',
        type: 'text',
        placeholder: 'Имя',
        value: name,
        onChange: (e) => setName(e.target.value),
        className: 'input',
        disabled: isLoading,
        required: true
      }),
      React.createElement('input', {
        key: 'email-input',
        type: 'email',
        placeholder: 'Email',
        value: email,
        onChange: (e) => setEmail(e.target.value),
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
      }, isLoading ? 'Генерация...' : 'Выпустить сертификат')
    ])),
    message && React.createElement('p', {
      key: 'message',
      style: { 
        color: message.includes('Ошибка') ? 'red' : 'green',
        marginTop: '10px',
        fontWeight: 'bold'
      }
    }, message)
  ]);
};

export default IssueCertificate;
