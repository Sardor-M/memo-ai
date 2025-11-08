import { useState, useEffect } from 'react';
import { Mic, Video, Plus } from 'lucide-react';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

export default function Dashboard() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const { isRecording, isMicrophoneActive, isCameraActive, startRecording, stopRecording } = useDeviceDetection();

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const data = await window.electronAPI?.getRecordings?.();
      setRecordings(data || []);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const handleStartRecording = async () => {
    await startRecording();
    setShowActiveWidget(true);
  };

  const handleStopRecording = async () => {
    await stopRecording();
    setShowActiveWidget(false);
    loadRecordings();
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome to Memo-AI</p>
          </div>
          <button
            onClick={handleStartRecording}
            disabled={isRecording}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            <Plus size={20} />
            New Recording
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Microphone Status */}
          <div className={`p-6 rounded-lg border-2 transition ${
            isMicrophoneActive 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <Mic size={24} className={isMicrophoneActive ? 'text-green-600' : 'text-gray-400'} />
              <div>
                <p className="text-sm text-gray-600">Microphone</p>
                <p className={`font-semibold ${isMicrophoneActive ? 'text-green-600' : 'text-gray-900'}`}>
                  {isMicrophoneActive ? 'Active' : 'Ready'}
                </p>
              </div>
            </div>
          </div>

          {/* Camera Status */}
          <div className={`p-6 rounded-lg border-2 transition ${
            isCameraActive 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <Video size={24} className={isCameraActive ? 'text-blue-600' : 'text-gray-400'} />
              <div>
                <p className="text-sm text-gray-600">Camera</p>
                <p className={`font-semibold ${isCameraActive ? 'text-blue-600' : 'text-gray-900'}`}>
                  {isCameraActive ? 'Active' : 'Ready'}
                </p>
              </div>
            </div>
          </div>

          {/* Recording Status */}
          <div className={`p-6 rounded-lg border-2 transition ${
            isRecording 
              ? 'bg-red-50 border-red-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-400'}`} />
              <div>
                <p className="text-sm text-gray-600">Recording</p>
                <p className={`font-semibold ${isRecording ? 'text-red-600' : 'text-gray-900'}`}>
                  {isRecording ? 'In Progress' : 'Idle'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Recordings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Recordings</h2>
          </div>

          {recordings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">🎤</div>
              <h3 className="text-lg font-semibold text-gray-900">No recordings yet</h3>
              <p className="text-gray-600 mt-2">Start a new recording to begin capturing your meetings</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recordings.map((recording, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition">
                  <h3 className="font-semibold text-gray-900">{recording.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{recording.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
