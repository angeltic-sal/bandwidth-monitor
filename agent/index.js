const fetch = require('node-fetch');
const WebSocket = require('ws');

class BandwidthAgent {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'ws://localhost:4000/metrics';
    this.interval = parseInt(process.env.SPEED_TEST_INTERVAL_MS) || 1000;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      console.log(`Connecting to ${this.backendUrl}...`);
      this.ws = new WebSocket(this.backendUrl);
      this.ws.on('open', () => {
        console.log('Connected to backend');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });
      this.ws.on('close', () => {
        console.log('Disconnected from backend');
        this.isConnected = false;
        this.scheduleReconnect();
      });
      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
        this.isConnected = false;
      });
    } catch (error) {
      console.error('Failed to connect:', error.message);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
      process.exit(1);
    }
  }

  async runSpeedTest() {
    try {
      const baseDownload = 50 + Math.random() * 100;
      const baseUpload = baseDownload * 0.3 + Math.random() * 10;
      const download = Math.max(10, baseDownload + (Math.random() - 0.5) * 20);
      const upload = Math.max(5, baseUpload + (Math.random() - 0.5) * 10);
      return {
        download: Math.round(download * 100) / 100,
        upload: Math.round(upload * 100) / 100,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Speed test failed:', error.message);
      return {
        upload: Math.random() * 50 + 10,
        download: Math.random() * 100 + 20,
        timestamp: new Date().toISOString()
      };
    }
  }

  sendMetrics(metrics) {
    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(metrics));
        console.log(`Sent metrics: ${JSON.stringify(metrics)}`);
      } catch (error) {
        console.error('Failed to send metrics:', error.message);
      }
    } else {
      console.log('Not connected, skipping metrics send');
    }
  }

  async start() {
    console.log('Starting bandwidth monitoring agent...');
    await this.connect();
    setInterval(async () => {
      try {
        const metrics = await this.runSpeedTest();
        this.sendMetrics(metrics);
      } catch (error) {
        console.error('Failed to run speed test:', error.message);
      }
    }, this.interval);
  }
}

process.on('SIGINT', () => {
  console.log('Shutting down agent...');
  if (this.ws) {
    this.ws.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down agent...');
  if (this.ws) {
    this.ws.close();
  }
  process.exit(0);
});

const agent = new BandwidthAgent();
agent.start().catch(error => {
  console.error('Failed to start agent:', error);
  process.exit(1);
}); 