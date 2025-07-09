import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subHours, parseISO } from 'date-fns';
import axios from 'axios';
import './App.css';
import Thoughts from './pages/Thoughts';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000';

function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [currentMetrics, setCurrentMetrics] = useState({ upload: 0, download: 0, timestamp: new Date().toISOString() });
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine); // Track real internet status
  const [ws, setWs] = useState(null);

  // Real internet connectivity detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket(`${WS_URL}/metrics`);
      websocket.onopen = () => {
        setIsConnected(true);
      };
      websocket.onmessage = (event) => {
        try {
          const metrics = JSON.parse(event.data);
          setCurrentMetrics(metrics);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      websocket.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };
      websocket.onerror = (error) => {
        setIsConnected(false);
      };
      setWs(websocket);
    };
    connectWebSocket();
    return () => { if (ws) ws.close(); };
  }, []);

  const formatSpeed = (speed) => `${Math.round(speed * 100) / 100} Mbps`;

  const renderLiveView = () => (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{formatSpeed(effectiveConnected ? currentMetrics.download : 0)}</div>
          <div className="metric-label">Download Speed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatSpeed(effectiveConnected ? currentMetrics.upload : 0)}</div>
          <div className="metric-label">Upload Speed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            <span className={`status-indicator ${effectiveConnected ? 'status-connected' : 'status-disconnected'}`}></span>
            {effectiveConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="metric-label">Connection Status</div>
        </div>
      </div>
      <div className="card">
        <h2>Real-time Speed Test</h2>
        <p>Last updated: {format(parseISO(currentMetrics.timestamp), 'HH:mm:ss')}</p>
        <p>Connection: {effectiveConnected ? 'Active' : 'Inactive'}</p>
      </div>
    </div>
  );

  // Use isOnline to override isConnected for UI
  const effectiveConnected = isConnected && isOnline;

  return (
    <Router>
      <div className={`app-container${!effectiveConnected ? ' disconnected-theme' : ''}`}> {/* Add disconnected-theme class when offline */}
        <nav className="main-nav">
          <ul>
            <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink></li>
            <li><NavLink to="/thoughts" className={({ isActive }) => isActive ? 'active' : ''}>Thoughts</NavLink></li>
          </ul>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <div className="container">
                <h1>Internet Bandwidth Monitor</h1>
                {/* Only show Live Monitor, no tabs */}
                {renderLiveView()}
              </div>
            } />
            <Route path="/thoughts" element={<Thoughts />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 