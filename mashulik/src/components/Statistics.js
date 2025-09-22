import React from 'react';
import { Link } from 'react-router-dom';

const Statistics = () => {
  const stats = [
    { label: 'Активные сертификаты', value: 150 },
    { label: 'Отозванные сертификаты', value: 10 },
    { label: 'Всего сертификатов', value: 160 },
  ];

  return (
    <div className="container">
      <Link to="/" className="back-button">Назад</Link>
      <h1>Статистика</h1>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Показатель</th>
              <th>Значение</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, index) => (
              <tr key={index}>
                <td>{stat.label}</td>
                <td>{stat.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Statistics;