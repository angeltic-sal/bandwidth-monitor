# AWS EC2 Deployment Checklist

## ✅ Pre-Deployment Checklist

### AWS Setup
- [ ] AWS Account with EC2 access
- [ ] EC2 t2.large instance launched
- [ ] Security Group configured with required ports:
  - [ ] SSH (22)
  - [ ] HTTP (80)
  - [ ] HTTPS (443)
  - [ ] Custom TCP (4000)
  - [ ] Custom TCP (8086)
- [ ] Key pair downloaded and accessible
- [ ] Domain name configured (optional, for SSL)

### Instance Requirements
- [ ] Amazon Linux 2 or Ubuntu 20.04+
- [ ] At least 20 GB EBS storage
- [ ] Public IP address assigned
- [ ] Internet connectivity confirmed

## 🚀 Deployment Steps

### Step 1: Instance Setup
- [ ] SSH into EC2 instance
- [ ] Run setup script: `./setup-ec2.sh`
- [ ] Log out and back in for Docker permissions
- [ ] Verify Docker is running: `docker --version`

### Step 2: Application Upload
- [ ] Create application directory: `/home/ec2-user/bandwidth-monitor`
- [ ] Upload application files (SCP, Git, or AWS CLI)
- [ ] Verify all files are present

### Step 3: Environment Configuration
- [ ] Copy environment template: `cp env.prod.example .env`
- [ ] Update EC2_PUBLIC_IP in .env file
- [ ] Set secure InfluxDB password and token
- [ ] Configure optional services (SendGrid, VAPID keys)

### Step 4: Application Deployment
- [ ] Make deployment script executable: `chmod +x deploy-aws.sh`
- [ ] Run deployment: `./deploy-aws.sh`
- [ ] Wait for all services to start (30 seconds)
- [ ] Verify health checks pass

## 🔒 SSL Setup (Production)

### Domain Configuration
- [ ] Domain points to EC2 public IP
- [ ] DNS propagation complete (check with `nslookup`)

### SSL Certificate
- [ ] Install Certbot: `sudo yum install -y certbot`
- [ ] Obtain SSL certificate: `sudo certbot certonly --standalone -d your-domain.com`
- [ ] Create InfluxDB password file: `sudo htpasswd -c /etc/nginx/.htpasswd admin`
- [ ] Update nginx.conf with domain name
- [ ] Add DOMAIN variable to .env file

### SSL Deployment
- [ ] Deploy with SSL: `docker-compose -f docker-compose.prod-ssl.yml up -d`
- [ ] Test HTTPS access
- [ ] Verify SSL certificate is valid

## ✅ Post-Deployment Verification

### Service Health
- [ ] Frontend accessible: `http://your-ec2-ip` or `https://your-domain.com`
- [ ] Backend API responding: `http://your-ec2-ip:4000/health`
- [ ] InfluxDB accessible: `http://your-ec2-ip:8086`
- [ ] All containers running: `docker-compose -f docker-compose.prod.yml ps`

### Application Functionality
- [ ] Speed test data appearing in dashboard
- [ ] Real-time updates working
- [ ] Historical data being stored
- [ ] Notifications working (if configured)

### Security Verification
- [ ] InfluxDB password protected
- [ ] SSL certificate valid (if using HTTPS)
- [ ] Security group rules properly configured
- [ ] No unnecessary ports exposed

## 📊 Monitoring Setup

### System Monitoring
- [ ] Set up CloudWatch alarms for:
  - [ ] CPU utilization > 80%
  - [ ] Memory utilization > 80%
  - [ ] Disk usage > 85%
  - [ ] Network errors
- [ ] Configure SNS notifications for critical alerts

### Application Monitoring
- [ ] Log rotation configured
- [ ] Backup strategy implemented
- [ ] SSL certificate renewal automated
- [ ] Application logs being collected

## 🔧 Maintenance Tasks

### Regular Maintenance
- [ ] Weekly: Check application logs
- [ ] Monthly: Update SSL certificate
- [ ] Monthly: Review and clean old logs
- [ ] Quarterly: Update application dependencies
- [ ] Quarterly: Review security group rules

### Backup Strategy
- [ ] Daily: InfluxDB data backup
- [ ] Weekly: Configuration backup
- [ ] Monthly: Full system backup
- [ ] Test backup restoration process

## 🚨 Troubleshooting Quick Reference

### Common Issues
- **Port conflicts**: `sudo netstat -tulpn | grep :80`
- **Docker permissions**: `sudo usermod -a -G docker ec2-user`
- **Memory issues**: `free -h` and add swap if needed
- **SSL issues**: `sudo certbot certificates`

### Useful Commands
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update application
git pull && docker-compose -f docker-compose.prod.yml up -d --build
```

## 📞 Support Information

- **Application Logs**: `docker-compose -f docker-compose.prod.yml logs -f`
- **System Resources**: `htop`, `df -h`, `free -h`
- **Network**: `netstat -tulpn`
- **Security Group**: AWS Console → EC2 → Security Groups

---

**Deployment Date**: _______________
**Deployed By**: _______________
**EC2 Instance ID**: _______________
**Domain**: _______________ 