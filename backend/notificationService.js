const webpush = require('web-push');
const sgMail = require('@sendgrid/mail');

class NotificationService {
  constructor(config = {}) {
    this.sendgridApiKey = config.sendgridApiKey;
    this.vapidPublicKey = config.vapidPublicKey;
    this.vapidPrivateKey = config.vapidPrivateKey;
    this.fromEmail = config.fromEmail;
    this.toEmail = config.toEmail;
    
    this.setupServices();
  }

  setupServices() {
    // Setup SendGrid
    if (this.sendgridApiKey && this.sendgridApiKey.startsWith('SG.')) {
      sgMail.setApiKey(this.sendgridApiKey);
    } else {
      console.log('SendGrid not configured or invalid API key');
    }

    // Setup Web Push
    if (this.vapidPublicKey && this.vapidPrivateKey && 
        this.vapidPublicKey !== 'your-vapid-public-key-here' &&
        this.vapidPrivateKey !== 'your-vapid-private-key-here') {
      try {
        webpush.setVapidDetails(
          'mailto:' + (this.fromEmail || 'noreply@bandwidth-monitor.com'),
          this.vapidPublicKey,
          this.vapidPrivateKey
        );
      } catch (error) {
        console.log('Web Push not configured or invalid keys:', error.message);
      }
    } else {
      console.log('Web Push not configured');
    }
  }

  async sendNotification(type, data) {
    try {
      switch (type) {
        case 'drop':
          await this.sendDropAlert(data);
          break;
        default:
          console.log(`Unknown notification type: ${type}`);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async sendDropAlert(data) {
    const message = this.formatDropMessage(data);
    
    // Send email notification
    if (this.sendgridApiKey && this.toEmail) {
      await this.sendEmail(message);
    }

    // Send web push notification
    if (this.vapidPublicKey && this.vapidPrivateKey) {
      await this.sendWebPush(message);
    }
  }

  formatDropMessage(data) {
    const timestamp = new Date(data.timestamp).toLocaleString();
    return {
      title: 'Bandwidth Drop Detected',
      body: `Your internet speed has dropped below ${data.threshold} Mbps for ${data.duration} seconds at ${timestamp}`,
      data: {
        type: 'drop',
        timestamp: data.timestamp,
        threshold: data.threshold,
        duration: data.duration
      }
    };
  }

  async sendEmail(message) {
    if (!this.sendgridApiKey || !this.toEmail) {
      console.log('SendGrid not configured, skipping email notification');
      return;
    }

    const msg = {
      to: this.toEmail,
      from: this.fromEmail || 'noreply@bandwidth-monitor.com',
      subject: message.title,
      text: message.body,
      html: `<p>${message.body}</p>`
    };

    try {
      await sgMail.send(msg);
      console.log('Email notification sent');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async sendWebPush(message) {
    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      console.log('Web Push not configured, skipping push notification');
      return;
    }

    // In a real application, you'd store subscription endpoints in a database
    // For now, we'll just log that we would send a push notification
    console.log('Would send web push notification:', message);
    
    // Example of how to send to a subscription:
    // const subscription = {
    //   endpoint: 'https://fcm.googleapis.com/fcm/send/...',
    //   keys: {
    //     p256dh: '...',
    //     auth: '...'
    //   }
    // };
    // 
    // try {
    //   await webpush.sendNotification(subscription, JSON.stringify(message));
    //   console.log('Web push notification sent');
    // } catch (error) {
    //   console.error('Failed to send web push:', error);
    // }
  }

  // Method to register web push subscriptions
  async registerSubscription(subscription) {
    // In a real application, you'd store this in a database
    console.log('New subscription registered:', subscription);
  }

  // Method to unregister web push subscriptions
  async unregisterSubscription(endpoint) {
    // In a real application, you'd remove this from the database
    console.log('Subscription unregistered:', endpoint);
  }
}

module.exports = NotificationService; 