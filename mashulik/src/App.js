import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import IssueCertificate from './components/IssueCertificate';
import RevokeCertificate from './components/RevokeCertificate';
import CheckStatus from './components/CheckStatus';
import CertificateList from './components/CertificateList';
import Statistics from './components/Statistics';
import backgroundImage from './assets/background.jpg'; // Импортируем изображение

const App = () => {
  return (
    <div style={{ 
      backgroundImage: `url(${backgroundImage})`, 
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      minHeight: '100vh' 
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/issue-certificate" element={<IssueCertificate />} />
          <Route path="/revoke-certificate" element={<RevokeCertificate />} />
          <Route path="/check-status" element={<CheckStatus />} />
          <Route path="/certificate-list" element={<CertificateList />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;