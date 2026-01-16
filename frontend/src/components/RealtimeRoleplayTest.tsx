'use client';

import { useRealtimeRoleplay } from '@/hooks/useRealtimeRoleplay';
import { useState } from 'react';

export default function RealtimeRoleplayTest() {
  const [scenarioId, setScenarioId] = useState('aba1a74a-f308-11f0-a033-00163e153d4e');
  const [config, setConfig] = useState({
    sessionId: `session-${Date.now()}`,
    scenarioId: 'aba1a74a-f308-11f0-a033-00163e153d4e',
  });
  
  const {
    sessionId,
    isConnected,
    isRecording,
    isProcessing,
    currentTranscription,
    aiResponse,
    error,
    volume,
    conversationHistory,
    turnCount,
    maxTurns,
    connectSession,
    startRecording,
    stopRecording,
    endSession,
  } = useRealtimeRoleplay(config);


  const handleConnect = async () => {
    try {
    // 1. Call your actual backend API to create a session record in Prisma
    const response = await fetch('/api/roleplay/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Explicitly set this
      },
      body: JSON.stringify({ scenarioId })
    });
    const newSession = await response.json();
    console.log("Response from /api/roleplay/start:", newSession.data.id);

    // 2. Use the REAL ID returned from your database
    setConfig({
      sessionId: newSession.data.id, 
      scenarioId,
    });
    connectSession({ sessionId: newSession.data.id, scenarioId });
    // await connectSession({ sessionId: newSession.id, scenarioId });
  } catch (err) {
    console.error("Failed to initialize session record", err);
  }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleEndSession = async () => {
    await endSession();
    setScenarioId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎤 Real-Time Roleplay Test
          </h1>
          <p className="text-slate-300">
            Test your real-time audio streaming and AI response system
          </p>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Connection Status */}
          <div className={`p-4 rounded-lg ${isConnected ? 'bg-green-900' : 'bg-red-900'}`}>
            <p className="text-slate-300 text-sm font-semibold">Connection</p>
            <p className={`text-2xl font-bold ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
              {isConnected ? '✓ Online' : '✗ Offline'}
            </p>
          </div>

          {/* Recording Status */}
          <div className={`p-4 rounded-lg ${isRecording ? 'bg-blue-900' : 'bg-slate-700'}`}>
            <p className="text-slate-300 text-sm font-semibold">Recording</p>
            <p className={`text-2xl font-bold ${isRecording ? 'text-blue-300' : 'text-slate-300'}`}>
              {isRecording ? '🔴 Active' : '⭕ Idle'}
            </p>
          </div>

          {/* Processing Status */}
          <div className={`p-4 rounded-lg ${isProcessing ? 'bg-yellow-900' : 'bg-slate-700'}`}>
            <p className="text-slate-300 text-sm font-semibold">Processing</p>
            <p className={`text-2xl font-bold ${isProcessing ? 'text-yellow-300' : 'text-slate-300'}`}>
              {isProcessing ? '⚙️ Working' : '✓ Ready'}
            </p>
          </div>

          {/* Turn Counter */}
          <div className="p-4 rounded-lg bg-slate-700">
            <p className="text-slate-300 text-sm font-semibold">Turn</p>
            <p className="text-2xl font-bold text-slate-300">
              {turnCount}/{maxTurns}
            </p>
          </div>
        </div>

        {/* Session ID Display */}
        {sessionId && (
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <p className="text-slate-400 text-sm">Session ID</p>
            <p className="text-slate-200 font-mono text-sm break-all">{sessionId}</p>
          </div>
        )}

        {/* Connection Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">🔌 Connection</h2>
          {!isConnected ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter Scenario ID"
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleConnect}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition"
              >
                Connect Session
              </button>
            </div>
          ) : (
            <button
              onClick={handleEndSession}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition"
            >
              End Session
            </button>
          )}
        </div>
        <button
              onClick={handleToggleRecording}
              // disabled={!isConnected}
              className={`w-full px-6 py-3 font-semibold rounded transition ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
            </button>

        {/* Recording Section */}
        {isConnected && (
          <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">🎙️ Recording</h2>
            
            {/* Volume Meter */}
            <div className="mb-4">
              <p className="text-slate-300 text-sm mb-2">Volume: {Math.round(volume * 100)}%</p>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>

            {/* Recording Button */}
            <button
              onClick={handleToggleRecording}
              disabled={!isConnected}
              className={`w-full px-6 py-3 font-semibold rounded transition ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
            </button>

            {/* Current Transcription */}
            {currentTranscription && (
              <div className="mt-4 p-3 bg-slate-700 rounded border-l-4 border-blue-500">
                <p className="text-slate-300 text-xs font-semibold mb-1">Current Transcription:</p>
                <p className="text-white">{currentTranscription}</p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-8">
            <p className="text-red-300 font-semibold mb-1">⚠️ Error</p>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">💬 Conversation</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversationHistory.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded ${
                  msg.role === 'USER' 
                    ? 'bg-blue-900 border-l-4 border-blue-500' 
                    : msg.role === 'AI'
                    ? 'bg-purple-900 border-l-4 border-purple-500'
                    : 'bg-slate-700 border-l-4 border-slate-500'
                }`}>
                  <p className="text-xs font-semibold text-slate-300 mb-1">
                    {msg.role === 'USER' ? '👤 You' : msg.role === 'AI' ? '🤖 AI' : '⚙️ System'}
                  </p>
                  <p className="text-white text-sm">{msg.content}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-slate-700 rounded-lg border border-slate-600">
          <p className="text-slate-300 text-sm">
            <strong>💡 Tip:</strong> Enter a scenario ID to connect, then click "Start Recording" to begin capturing audio. 
            The system will automatically transcribe your speech and generate AI responses.
          </p>
        </div>
      </div>
    </div>
  );
}
