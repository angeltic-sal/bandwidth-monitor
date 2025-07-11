# Bandwidth Monitor - AWS EC2 Deployment Guide

A comprehensive guide to deploy the Internet Bandwidth Monitor on AWS EC2 t2.large instance.

## 🏗️ Architecture Overview

The application consists of 5 main services:
- **Frontend**: React.js web application (Port 80/443)
- **Backend**: Node.js API server (Port 4000)
- **Agent**: Speed test monitoring service
- **InfluxDB**: Time-series database for metrics (Port 8086)
- **Redis**: Message queue for background jobs (Port 6379)

## 📋 Prerequisites

### AWS Requirements
- AWS Account with EC2 access
- EC2 t2.large instance (or larger)
- Security Group with required ports open
- Domain name (optional, for SSL)

### Instance Specifications
- **Instance Type**: t2.large (2 vCPU, 8 GB RAM)
- **OS**: Amazon Linux 2 or Ubuntu 20.04+
- **Storage**: At least 20 GB EBS volume
- **Security Group**: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 4000 (API), 8086 (InfluxDB)

## 🚀 Quick Deployment

### Step 1: Launch EC2 Instance

1. **Launch Instance**:
   ```bash
   # Use Amazon Linux 2 AMI
   # Instance Type: t2.large
   # Storage: 20 GB gp3
   # Security Group: Create new with rules below
   ```

2. **Security Group Rules**:
   ```
   SSH (22): 0.0.0.0/0 (or your IP)
   HTTP (80): 0.0.0.0/0
   HTTPS (443): 0.0.0.0/0
   Custom TCP (4000): 0.0.0.0/0
   Custom TCP (8086): 0.0.0.0/0
   ```

### Step 2: Connect to Instance

```bash
# SSH into your instance
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### Step 3: Setup Instance

```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/yourusername/checkYourInternet/main/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

### Step 4: Upload Application

```bash
# Create application directory
mkdir -p /home/ec2-user/bandwidth-monitor
cd /home/ec2-user/bandwidth-monitor

# Upload your application files (using scp, git, or AWS CLI)
# Option 1: Using SCP
scp -r -i your-key.pem /path/to/checkYourInternet/* ec2-user@your-ec2-public-ip:/home/ec2-user/bandwidth-monitor/

# Option 2: Using Git
git clone https://github.com/yourusername/checkYourInternet.git .
```

### Step 5: Configure Environment

```bash
# Copy production environment template
cp env.prod.example .env

# Edit the environment file
nano .env
```

**Required Environment Variables**:
```bash
# AWS Configuration
EC2_PUBLIC_IP=your-ec2-public-ip

# InfluxDB Configuration
INFLUXDB_USERNAME=admin
INFLUXDB_PASSWORD=your-secure-password
INFLUXDB_ORG=bandwidth-monitor
INFLUXDB_BUCKET=bandwidth-metrics
INFLUXDB_TOKEN=your-secure-token

# Optional: Email Notifications
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_TO_EMAIL=alerts@yourdomain.com

# Optional: Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### Step 6: Deploy Application

```bash
# Make deployment script executable
chmod +x deploy-aws.sh

# Run deployment
./deploy-aws.sh
```

## 🔒 Production Deployment with SSL

For production use, it's recommended to set up SSL with a domain name.

### Step 1: Domain Configuration

1. **Point your domain** to your EC2 public IP
2. **Wait for DNS propagation** (can take up to 48 hours)

### Step 2: Install SSL Certificate

```bash
# Install Certbot
sudo yum install -y certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Create password file for InfluxDB
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

### Step 3: Update Configuration

```bash
# Update nginx.conf with your domain
sed -i 's/your-domain.com/your-actual-domain.com/g' nginx.conf

# Update .env file
echo "DOMAIN=your-domain.com" >> .env
```

### Step 4: Deploy with SSL

```bash
# Deploy with SSL configuration
docker-compose -f docker-compose.prod-ssl.yml up -d
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Backup Strategy

```bash
# Backup InfluxDB data
docker exec bandwidth-influxdb influx backup /backup

# Backup Redis data
docker exec bandwidth-redis redis-cli BGSAVE

# Backup configuration
tar -czf backup-$(date +%Y%m%d).tar.gz .env docker-compose.prod.yml
```

### Updates and Maintenance

```bash
# Update application
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Update SSL certificate (monthly)
sudo certbot renew
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :80
   
   # Stop conflicting service
   sudo systemctl stop httpd
   ```

2. **Docker Permission Issues**:
   ```bash
   # Add user to docker group
   sudo usermod -a -G docker ec2-user
   
   # Log out and back in
   exit
   # SSH back in
   ```

3. **Memory Issues**:
   ```bash
   # Check memory usage
   free -h
   
   # Increase swap if needed
   sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **SSL Certificate Issues**:
   ```bash
   # Test certificate
   sudo certbot certificates
   
   # Renew certificate
   sudo certbot renew --dry-run
   ```

### Performance Optimization

1. **Database Optimization**:
   ```bash
   # InfluxDB retention policy
   docker exec bandwidth-influxdb influx bucket update --name bandwidth-metrics --retention 30d
   ```

2. **Log Rotation**:
   ```bash
   # Check log rotation
   sudo logrotate -d /etc/logrotate.d/bandwidth-monitor
   ```

## 📈 Scaling Considerations

### Vertical Scaling
- Upgrade to t3.large or t3.xlarge for more resources
- Increase EBS volume size for more storage

### Horizontal Scaling
- Use Application Load Balancer for multiple instances
- Consider RDS for database instead of containerized InfluxDB
- Use ElastiCache for Redis instead of containerized Redis

### Monitoring
- Set up CloudWatch alarms for CPU, memory, and disk usage
- Configure SNS notifications for critical alerts
- Use AWS X-Ray for distributed tracing

## 💰 Cost Optimization

### EC2 Instance
- Use Reserved Instances for long-term deployments
- Consider Spot Instances for non-critical workloads
- Monitor and right-size instance based on usage

### Storage
- Use gp3 EBS volumes for better performance/cost ratio
- Implement lifecycle policies for log rotation
- Consider S3 for long-term data archival

### Network
- Use CloudFront for global content delivery
- Consider VPC endpoints for AWS service access
- Monitor data transfer costs

## 🔐 Security Best Practices

1. **Network Security**:
   - Restrict security group rules to specific IPs
   - Use VPC for network isolation
   - Implement WAF for web application protection

2. **Application Security**:
   - Regularly update dependencies
   - Use secrets management (AWS Secrets Manager)
   - Implement proper authentication for InfluxDB

3. **Infrastructure Security**:
   - Enable CloudTrail for API logging
   - Use IAM roles instead of access keys
   - Implement proper backup and disaster recovery

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review application logs: `docker-compose logs -f`
- Monitor system resources: `htop`, `df -h`, `free -h`
- Check security group rules in AWS Console

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details. 