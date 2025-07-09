class DropDetector {
  constructor(config = {}) {
    this.threshold = config.threshold || 10; // Mbps
    this.windowSeconds = config.windowSeconds || 10;
    this.durationThreshold = config.durationThreshold || 2; // seconds
    this.metrics = [];
    this.lastAlertTime = null;
    this.alertCooldown = 5 * 60 * 1000; // 5 minutes
  }

  addMetric(metric) {
    const timestamp = new Date(metric.timestamp);
    const downloadSpeed = metric.download;

    // Add new metric
    this.metrics.push({
      timestamp,
      download: downloadSpeed
    });

    // Remove old metrics outside the window
    const cutoffTime = new Date(timestamp.getTime() - this.windowSeconds * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    // Check for drops
    return this.checkForDrop();
  }

  checkForDrop() {
    if (this.metrics.length < this.durationThreshold) {
      return false;
    }

    // Check if we're in a cooldown period
    if (this.lastAlertTime && 
        Date.now() - this.lastAlertTime < this.alertCooldown) {
      return false;
    }

    // Count consecutive measurements below threshold
    let consecutiveDrops = 0;
    let maxConsecutiveDrops = 0;

    for (let i = this.metrics.length - 1; i >= 0; i--) {
      const metric = this.metrics[i];
      
      if (metric.download < this.threshold) {
        consecutiveDrops++;
        maxConsecutiveDrops = Math.max(maxConsecutiveDrops, consecutiveDrops);
      } else {
        consecutiveDrops = 0;
      }
    }

    // Check if we have enough consecutive drops
    if (maxConsecutiveDrops >= this.durationThreshold) {
      this.lastAlertTime = Date.now();
      
      console.log(`Drop detected: ${maxConsecutiveDrops} consecutive measurements below ${this.threshold} Mbps`);
      
      return {
        detected: true,
        consecutiveDrops: maxConsecutiveDrops,
        threshold: this.threshold,
        currentSpeed: this.metrics[this.metrics.length - 1].download,
        timestamp: new Date().toISOString()
      };
    }

    return false;
  }

  getMetrics() {
    return this.metrics.map(m => ({
      timestamp: m.timestamp.toISOString(),
      download: m.download
    }));
  }

  updateConfig(config) {
    if (config.threshold !== undefined) {
      this.threshold = config.threshold;
    }
    if (config.windowSeconds !== undefined) {
      this.windowSeconds = config.windowSeconds;
    }
    if (config.durationThreshold !== undefined) {
      this.durationThreshold = config.durationThreshold;
    }
  }
}

module.exports = DropDetector; 