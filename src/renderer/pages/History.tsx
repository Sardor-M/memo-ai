import { useState, useEffect } from 'react';
import { Play, Download, Trash2, Search, Filter } from 'lucide-react';

interface Recording {
  id: string;
  name: string;
  date: string;
  duration: string;
  transcript?: string;
  size: string;
}

export default function History() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('all');

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const data = await window.electronAPI.getRecordings?.();
      setRecordings(data || mockRecordings);
    } catch (error) {
      console.error('Failed to load recordings:', error);
      setRecordings(mockRecordings);
    }
  };

  const mockRecordings: Recording[] = [
    {
      id: '1',
      name: 'Q4 Planning Meeting',
      date: 'Nov 8, 2024',
      duration: '45:30',
      transcript: 'Discussed Q4 goals and objectives...',
      size: '124 MB',
    },
    {
      id: '2',
      name: 'Design Review Session',
      date: 'Nov 7, 2024',
      duration: '32:15',
      transcript: 'Reviewed new UI designs and feedback...',
      size: '89 MB',
    },
    {
      id: '3',
      name: 'Team Standup',
      date: 'Nov 6, 2024',
      duration: '15:20',
      transcript: 'Daily standup with the team...',
      size: '45 MB',
    },
  ];

  const filteredRecordings = recordings.filter((rec) =>
    rec.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recording History</h1>
            <p className="text-gray-600 mt-1">Browse and manage your recordings</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">
            + New Recording
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {filteredRecordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recordings found</h3>
            <p className="text-gray-600">Your recording history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRecordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-white p-6 hover:bg-gray-50 transition border-b border-gray-100 last:border-0"
              >
                <div className="flex justify-between items-start">
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{recording.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>{recording.date}</span>
                      <span>•</span>
                      <span>Duration: {recording.duration}</span>
                      <span>•</span>
                      <span>Size: {recording.size}</span>
                    </div>
                    {recording.transcript && (
                      <p className="text-gray-700 mt-3 line-clamp-2 italic">
                        "{recording.transcript}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      title="Play recording"
                      className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                    >
                      <Play size={20} />
                    </button>
                    <button
                      title="Download"
                      className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      title="Delete"
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Progress bar for recent recording */}
                {recording.id === '1' && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full"
                        style={{ width: '65%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="bg-white border-t border-gray-200 p-6 grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{recordings.length}</div>
          <p className="text-sm text-gray-600">Total Recordings</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.floor(recordings.reduce((acc, r) => {
              const parts = r.duration.split(':').map(Number);
              return acc + (parts[0] * 60 + parts[1]);
            }, 0) / 60)}
          </div>
          <p className="text-sm text-gray-600">Total Hours</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {recordings.filter(r => r.transcript).length}
          </div>
          <p className="text-sm text-gray-600">Transcribed</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {(recordings.reduce((acc, r) => {
              const size = parseInt(r.size) * (r.size.includes('GB') ? 1024 : 1);
              return acc + size;
            }, 0) / 1024).toFixed(1)}
          </div>
          <p className="text-sm text-gray-600">Total Size (GB)</p>
        </div>
      </div>
    </div>
  );
}

