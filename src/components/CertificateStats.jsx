import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const CertificateStats = ({ valid, revoked }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    // Очистка предыдущего графика
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Активные', 'Отозванные'],
        datasets: [{
          label: 'Количество сертификатов',
          data: [valid, revoked],
          backgroundColor: ['#4caf50', '#f44336']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Статусы сертификатов'
          }
        }
      }
    });
  }, [valid, revoked]);

  return <canvas ref={chartRef} />;
};

export default CertificateStats;