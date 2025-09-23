import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ active: 0, revoked: 0, total: 0 });

  // Загрузка сертификатов с сервера
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setIsLoading(true);
        setMessage('');
        
        const response = await fetch('http://localhost:3001/api/certificates');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Получены данные с сервера:', data);
        
        // Ваш сервер возвращает { list: [], stats: {} }
        if (data.list) {
          setCertificates(data.list);
          setStats(data.stats || { active: 0, revoked: 0, total: 0 });
          setMessage('');
        } else {
          setMessage('Ошибка: неверный формат данных от сервера');
        }
      } catch (error) {
        console.error('Ошибка загрузки:', error);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          setMessage('Ошибка сети! Убедитесь, что сервер запущен на localhost:3001');
        } else {
          setMessage(`Ошибка: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  if (isLoading) {
    return React.createElement('div', { className: 'container' }, [
      React.createElement(Link, {
        key: 'back-link',
        to: '/',
        className: 'back-button'
      }, 'Назад'),
      React.createElement('h1', { key: 'title' }, 'Список сертификатов'),
      React.createElement('p', { key: 'loading' }, 'Загрузка сертификатов...')
    ]);
  }

  if (message && certificates.length === 0) {
    return React.createElement('div', { className: 'container' }, [
      React.createElement(Link, {
        key: 'back-link',
        to: '/',
        className: 'back-button'
      }, 'Назад'),
      React.createElement('h1', { key: 'title' }, 'Список сертификатов'),
      React.createElement('p', { 
        key: 'error-message',
        style: { 
          color: 'red', 
          fontWeight: 'bold',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          border: '1px solid #ffcccc',
          borderRadius: '4px'
        }
      }, message)
    ]);
  }

  return React.createElement('div', { className: 'container' }, [
    React.createElement(Link, {
      key: 'back-link',
      to: '/',
      className: 'back-button'
    }, 'Назад'),
    
    React.createElement('h1', { key: 'title' }, 'Список сертификатов'),
    
    // Статистика
    React.createElement('div', {
      key: 'stats',
      style: {
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }
    }, [
      React.createElement('div', {
        key: 'total',
        style: {
          padding: '10px 15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '5px',
          fontWeight: 'bold'
        }
      }, `Всего: ${stats.total}`),
      
      React.createElement('div', {
        key: 'active',
        style: {
          padding: '10px 15px',
          backgroundColor: '#e8f5e8',
          color: '#2e7d32',
          borderRadius: '5px',
          fontWeight: 'bold'
        }
      }, `Активных: ${stats.active}`),
      
      React.createElement('div', {
        key: 'revoked',
        style: {
          padding: '10px 15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '5px',
          fontWeight: 'bold'
        }
      }, `Отозвано: ${stats.revoked}`)
    ]),
    
    certificates.length === 0 ? (
      React.createElement('p', { key: 'empty' }, 'Сертификатов пока нет')
    ) : (
      React.createElement('div', { 
        key: 'table-container',
        className: 'table-container' 
      }, 
        React.createElement('table', { key: 'table' }, [
          React.createElement('thead', { key: 'thead' },
            React.createElement('tr', { key: 'header-row' }, [
              React.createElement('th', { key: 'id-header' }, 'ID'),
              React.createElement('th', { key: 'name-header' }, 'Имя'),
              React.createElement('th', { key: 'email-header' }, 'Email'),
              React.createElement('th', { key: 'status-header' }, 'Статус'),
              React.createElement('th', { key: 'serial-header' }, 'Серийный номер'),
              React.createElement('th', { key: 'issued-header' }, 'Дата выдачи'),
              React.createElement('th', { key: 'expires-header' }, 'Действует до')
            ])
          ),
          
          React.createElement('tbody', { key: 'tbody' },
            certificates.map((cert) => 
              React.createElement('tr', { 
                key: cert.id,
                style: { 
                  backgroundColor: cert.status === 'active' ? '#f8fff8' : '#fff5f5'
                }
              }, [
                React.createElement('td', { key: 'id' }, cert.id),
                React.createElement('td', { key: 'name' }, cert.commonName),
                React.createElement('td', { key: 'email' }, cert.email),
                React.createElement('td', { key: 'status' }, 
                  React.createElement('span', {
                    style: { 
                      color: cert.status === 'active' ? 'green' : 'red',
                      fontWeight: 'bold'
                    }
                  }, cert.status === 'active' ? 'Активен' : 'Отозван')
                ),
                React.createElement('td', { key: 'serial' }, 
                  React.createElement('small', {}, cert.serialNumber)
                ),
                React.createElement('td', { key: 'issued' }, 
                  new Date(cert.issuedAt).toLocaleDateString('ru-RU')
                ),
                React.createElement('td', { key: 'expires' }, 
                  cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString('ru-RU') : '—'
                )
              ])
            )
          )
        ])
      )
    )
  ]);
};

export default CertificateList;
