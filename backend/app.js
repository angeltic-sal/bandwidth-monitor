require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const webpush = require('web-push');
const sgMail = require('@sendgrid/mail');

const DropDetector = require('./dropDetector');
const NotificationService = require('./notificationService');

class BandwidthBackend {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 4000;
    this.wss = null;
    this.influxDB = null;
    this.redis = null;
    this.queue = null;
    this.dropDetector = null;
    this.notificationService = null;
    this.setupMiddleware();
    this.setupInfluxDB();
    this.setupRedis();
    this.setupQueue();
    this.setupWebSocket();
    this.setupRoutes();
    this.setupDropDetection();
    this.setupNotifications();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan('combined'));
    this.app.use(express.json());
  }

  setupInfluxDB() {
    const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
    const token = process.env.INFLUXDB_TOKEN;
    const org = process.env.INFLUXDB_ORG;
    const bucket = process.env.INFLUXDB_BUCKET;
    if (!token || !org || !bucket) {
      console.error('InfluxDB configuration missing');
      process.exit(1);
    }
    this.influxDB = new InfluxDB({ url, token });
    this.writeApi = this.influxDB.getWriteApi(org, bucket, 'ms');
    this.queryApi = this.influxDB.getQueryApi(org);
    console.log('InfluxDB connected');
  }

  setupRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    this.redis.on('connect', () => {
      console.log('Redis connected');
    });
    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
    });
  }

  setupQueue() {
    this.queue = new Queue('bandwidth-alerts', {
      connection: this.redis
    });
    this.worker = new Worker('bandwidth-alerts', async (job) => {
      const { type, data } = job.data;
      await this.notificationService.sendNotification(type, data);
    }, {
      connection: this.redis
    });
    this.worker.on('completed', (job) => {
      console.log(`Alert job ${job.id} completed`);
    });
    this.worker.on('failed', (job, err) => {
      console.error(`Alert job ${job.id} failed:`, err);
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ noServer: true });
    this.wss.on('connection', (ws, req) => {
      console.log('WebSocket client connected');
      ws.on('message', async (message) => {
        try {
          const metrics = JSON.parse(message);
          await this.handleMetrics(metrics);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    this.app.post('/metrics', async (req, res) => {
      try {
        const metrics = req.body;
        await this.handleMetrics(metrics);
        res.json({ status: 'success' });
      } catch (error) {
        console.error('Error handling metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    this.app.get('/history', async (req, res) => {
      try {
        const { from, to } = req.query;
        const history = await this.getHistory(from, to);
        res.json(history);
      } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    this.app.get('/settings', (req, res) => {
      const settings = {
        dropThreshold: process.env.DROP_THRESHOLD_MBPS || 10,
        dropDetectionWindow: process.env.DROP_DETECTION_WINDOW_SECONDS || 10,
        dropDurationThreshold: process.env.DROP_DURATION_THRESHOLD_SECONDS || 2,
        alertAdvanceMinutes: process.env.ALERT_ADVANCE_MINUTES || 5
      };
      res.json(settings);
    });
    this.app.put('/settings', (req, res) => {
      const { dropThreshold, dropDetectionWindow, dropDurationThreshold, alertAdvanceMinutes } = req.body;
      res.json({ status: 'success', message: 'Settings updated' });
    });
  }

  setupDropDetection() {
    this.dropDetector = new DropDetector({
      threshold: process.env.DROP_THRESHOLD_MBPS || 10,
      windowSeconds: process.env.DROP_DETECTION_WINDOW_SECONDS || 10,
      durationThreshold: process.env.DROP_DURATION_THRESHOLD_SECONDS || 2
    });
  }

  setupNotifications() {
    this.notificationService = new NotificationService({
      sendgridApiKey: process.env.SENDGRID_API_KEY,
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      toEmail: process.env.SENDGRID_TO_EMAIL
    });
  }

  async handleMetrics(metrics) {
    const point = new Point('bandwidth_metrics')
      .floatField('upload', metrics.upload)
      .floatField('download', metrics.download)
      .timestamp(new Date(metrics.timestamp));
    await this.writeApi.writePoint(point);
    await this.writeApi.flush();
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(metrics));
      }
    });
    const dropDetected = this.dropDetector.addMetric(metrics);
    if (dropDetected) {
      await this.queue.add('drop-detected', {
        type: 'drop',
        data: {
          timestamp: new Date().toISOString(),
          threshold: this.dropDetector.threshold,
          duration: this.dropDetector.durationThreshold
        }
      });
    }
  }

  async getHistory(from, to) {
    const fromTime = from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const toTime = to || new Date().toISOString();
    const query = `
      from(bucket: "${process.env.INFLUXDB_BUCKET}")
        |> range(start: ${fromTime}, stop: ${toTime})
        |> filter(fn: (r) => r._measurement == "bandwidth_metrics")
        |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
    `;
    const results = [];
    for await (const { values, tableMeta } of this.queryApi.iterateRows(query)) {
      const o = tableMeta.toObject(values);
      results.push({
        timestamp: o._time,
        upload: o.upload,
        download: o.download
      });
    }
    return results;
  }

  start() {
    const server = this.app.listen(this.port, () => {
      console.log(`Backend server running on port ${this.port}`);
    });
    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/metrics') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });
  }
}

const backend = new BandwidthBackend();
backend.start(); 