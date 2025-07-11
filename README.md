# Bandwidth Monitor

A simple app to monitor your internet speed in real time.

## Quick Start

### Local Development

1. Clone this repo and go to the folder:
   ```bash
   git clone <repo-url>
   cd checkYourInternet
   ```
2. Copy the example environment file and edit if needed:
   ```bash
   cp env.example .env
   # Edit .env if you want custom settings
   ```
3. Start everything with Docker Compose:
   ```bash
   ./deploy.sh
   # or
   docker-compose up -d
   ```

### AWS EC2 Production Deployment

For production deployment on AWS EC2 t2.large, see the comprehensive guide:

📖 **[AWS Deployment Guide](README-AWS.md)**

Quick deployment:
```bash
# On your EC2 instance
./setup-ec2.sh
cp env.prod.example .env
# Edit .env with your configuration
./deploy-aws.sh
```

## Access the Dashboard

- **Local**: Open [http://localhost:3000](http://localhost:3000) in your browser



https://github.com/user-attachments/assets/c70cc0ff-9f82-4a58-a6a5-7d0201876b50




<img width="1710" alt="Screenshot 2025-07-08 at 11 52 14 PM" src="https://github.com/user-attachments/assets/5c41f24c-8daa-4d8b-99bf-bb8a9af13f90" />

<img width="1710" alt="Screenshot 2025-07-08 at 11 51 05 PM" src="https://github.com/user-attachments/assets/49e51cfc-a6de-466f-a6bb-15d308a427ef" />

<img width="1710" alt="s3" src="https://github.com/user-attachments/assets/997b1bef-0b61-4d51-97ca-d370f7d37f35" />


