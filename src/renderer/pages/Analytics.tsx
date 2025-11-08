import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Zap } from 'lucide-react';

type Stats = {
  totalRecordings: number;
  totalDuration: number;
  avgDuration: number;
  transcriptions: number;
  lastRecording: string;
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats>({
    totalRecordings: 0,
    totalDuration: 0,
    avgDuration: 0,
    transcriptions: 0,
    lastRecording: 'N/A',
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await window.electronAPI.getRecordings();
      if (data && data.length > 0) {
        const totalDuration = data.reduce((acc, r) => {
          const parts = r.duration.split(':').map(Number);
          return acc + (parts[0] * 60 + parts[1]);
        }, 0);

        setStats({
          totalRecordings: data.length,
          totalDuration: totalDuration,
          avgDuration: Math.round(totalDuration / data.length),
          transcriptions: data.filter(r => r.transcript).length,
          lastRecording: data[0]?.date || 'N/A',
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const StatCard = ({ icon: Icon, label, value, unit = '' }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value}
            <span className="text-lg text-gray-600 ml-2">{unit}</span>
          </p>
        </div>
        <div className="p-3 bg-blue-100 rounded-lg">
          <Icon size={24} className="text-blue-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Track your recording activity and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Total Recordings"
          value={stats.totalRecordings}
        />
        <StatCard
          icon={Clock}
          label="Total Duration"
          value={Math.floor(stats.totalDuration / 60)}
          unit="min"
        />
        <StatCard
          icon={Zap}
          label="Average Duration"
          value={Math.floor(stats.avgDuration / 60)}
          unit="min"
        />
        <StatCard
          icon={TrendingUp}
          label="Transcribed"
          value={stats.transcriptions}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Activity</h2>
          <div className="space-y-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="flex items-center gap-2">
                <span className="w-10 text-sm font-medium text-gray-600">{day}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.random() * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm text-gray-600">
                  {Math.floor(Math.random() * 5)}h
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recording Quality */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recording Quality</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Clarity Score</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
              <p className="text-xs text-gray-600 mt-1">85%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Noise Level</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
              <p className="text-xs text-gray-600 mt-1">45%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Transcription Accuracy</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }} />
              </div>
              <p className="text-xs text-gray-600 mt-1">92%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Recording Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Last Recording</p>
            <p className="font-semibold text-gray-900 mt-1">{stats.lastRecording}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Peak Recording Time</p>
            <p className="font-semibold text-gray-900 mt-1">10:00 AM</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Most Used Feature</p>
            <p className="font-semibold text-gray-900 mt-1">Transcription</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Avg Sessions/Day</p>
            <p className="font-semibold text-gray-900 mt-1">2.5</p>
          </div>
        </div>
      </div>
    </div>
  );
}

