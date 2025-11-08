import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [recordings, setRecordings] = useState<any[]>([]);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const data = await window.electronAPI.getRecordings();
      setRecordings(data);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const handleShowWidget = async () => {
    await window.electronAPI.showWidget();
  };

  return (
    <div style={{ padding: '40px', background: '#f5f5f7', minHeight: '100vh' }}>
      <header style={{ 
        background: 'white', 
        padding: '20px 40px', 
        borderRadius: '16px',
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>🎙️ MeetingMind Desktop</h1>
        <button 
          onClick={handleShowWidget}
          style={{
            background: '#007aff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Open Recording Widget
        </button>
      </header>

      <main>
        <h2>Analytics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '42px', color: '#007aff', margin: '0 0 8px 0' }}>{recordings.length}</h3>
            <p style={{ margin: 0, color: '#86868b' }}>Total Recordings</p>
          </div>
        </div>

        <h2>Recent Recordings</h2>
        <div style={{ background: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px' }}>🎤</div>
          <h3>No recordings yet</h3>
          <p style={{ color: '#86868b' }}>Click "Open Recording Widget" to start!</p>
        </div>
      </main>
    </div>
  );
}