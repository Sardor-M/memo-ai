import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f7',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '72px', margin: '0 0 16px 0', fontWeight: 'bold' }}>404</h1>
        <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: '#1f2937' }}>
          Page Not Found
        </h2>
        <p style={{ color: '#6b7280', margin: '0 0 32px 0' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <button
        onClick={() => navigate('/')}
        style={{
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
      >
        Go Back Home
      </button>
    </div>
  );
}

