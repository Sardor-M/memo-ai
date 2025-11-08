import { useState, useEffect } from 'react';
import { Play, Trash2 } from 'lucide-react';

type Recording = {
  id: string;
  name: string;
  date: string;
  duration: string;
  transcript?: string;
  size: string;
}

export default function Home() {
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const data = await window.electronAPI.getRecordings();
      setRecordings(data || []);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const handleShowWidget = async () => {
    await window.electronAPI.showWidget();
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Home</h1>
          <p className="text-gray-600 mt-2">Manage your recordings and transcripts</p>
        </div>
        <button
          onClick={handleShowWidget}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          + New Recording
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-blue-600">{recordings.length}</div>
          <p className="text-gray-600 mt-2">Total Recordings</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-green-600">
            {recordings.reduce((acc, r) => {
              const parts = r.duration.split(':').map(Number);
              return acc + (parts[0] * 60 + parts[1]);
            }, 0) / 60}
          </div>
          <p className="text-gray-600 mt-2">Total Hours</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-purple-600">
            {recordings.filter(r => r.transcript).length}
          </div>
          <p className="text-gray-600 mt-2">Transcribed</p>
        </div>
      </div>

      {/* Recent Recordings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Recordings</h2>
        </div>
        
        {recordings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🎤</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recordings yet</h3>
            <p className="text-gray-600">Click "New Recording" to start recording your first meeting</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recordings.map((recording) => (
              <div key={recording.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{recording.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{recording.date}</p>
                    {recording.transcript && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">{recording.transcript}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-sm text-gray-600">{recording.duration}</span>
                    <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                      <Play size={18} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

