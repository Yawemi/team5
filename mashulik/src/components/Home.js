import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container">
      <h1>Онлайн проверка сертификатов</h1>
      <div className="button-container">
        <Link to="/issue-certificate" className="button">Выпуск сертификатов</Link>
        <Link to="/revoke-certificate" className="button">Отзыв сертификата</Link>
        <Link to="/check-status" className="button">Проверка статуса сертификата (OCSP)</Link>
        <Link to="/certificate-list" className="button">Список сертификатов</Link>
      </div>
    </div>
  );
};

export default Home;
