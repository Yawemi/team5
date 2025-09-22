import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const IssueCertificate = () => {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Сертификат для ${formData.name} (${formData.email}) успешно выпущен!`);
  };

  return (
    <div className="container">
      <Link to="/" className="back-button">Назад</Link>
      <h1>Выпуск сертификатов</h1>
      <div className="input-container">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            name="name"
            placeholder="Имя"
            value={formData.name}
            onChange={handleChange}
            className="input"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="input"
          />
          <button type="submit" className="button">Выпустить сертификат</button>
        </form>
      </div>
    </div>
  );
};

export default IssueCertificate;