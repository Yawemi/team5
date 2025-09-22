import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './global.css'; // Импортируем глобальные стили

document.title = "Онлайн проверка сертификатов";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);