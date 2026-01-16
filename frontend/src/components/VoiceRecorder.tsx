"use client";

import React, { useState, useRef } from 'react';

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const mediaRecorderRef = useRef(null);
  const animationRef = useRef(null);

  const startRecording = async () => {
    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // --- Volume Analysis Logic ---
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setVolume(average); 
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
      // ------------------------------

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = { 
        recorder: mediaRecorder, 
        stream: stream, 
        context: audioContext 
      };

      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          console.log("Audio Data:", await e.data.arrayBuffer());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started...");
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    const { recorder, stream, context } = mediaRecorderRef.current;
    recorder.stop();
    stream.getTracks().forEach(track => track.stop());
    context.close(); // Stop the audio context
    cancelAnimationFrame(animationRef.current); // Stop volume updates
    setIsRecording(false);
    setVolume(0);
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

        <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Voice to Console</h2>
        <div style={{ 
        width: '200px', 
        height: '20px', 
        backgroundColor: '#eee', 
        margin: '10px auto', 
        borderRadius: '10px',
        overflow: 'hidden' 
      }}>
        {/* The Actual Volume Level */}
        <div style={{ 
          width: `${Math.min(volume * 2, 100)}%`, 
          height: '100%', 
          backgroundColor: '#4CAF50',
          transition: 'width 0.1s ease'
        }} />
      </div>
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            padding: '10px 20px',
            backgroundColor: isRecording ? '#ff4d4d' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
        {isRecording ? 'Stop & Output Data' : 'Start Recording'}
        </button>
      <p>Open your browser console (F12) to see the output.</p>
    </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;