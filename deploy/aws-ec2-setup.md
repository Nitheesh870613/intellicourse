# AWS EC2 (Ubuntu) Deployment Guide

This guide walks through deploying the application to an Amazon Web Services (AWS) EC2 `t3.micro` instance running Ubuntu, configured with Docker, Docker Compose, and Caddy reverse proxy for automated SSL/TLS (HTTPS).

---

## Table of Contents
1. [Launch EC2 Instance & Security Group](#1-launch-ec2-instance--security-group)
2. [Connect to the EC2 Instance](#2-connect-to-the-ec2-instance)
3. [Recommended: Add Swap Space (Crucial for t3.micro)](#3-recommended-add-swap-space-crucial-for-t3micro)
4. [Install Docker & Docker Compose Plugin](#4-install-docker--docker-compose-plugin)
5. [Clone or Copy the Project](#5-clone-or-copy-the-project)
6. [Configure Environment Variables (`.env`)](#6-configure-environment-variables-env)
7. [Configure Domain in Caddyfile](#7-configure-domain-in-caddyfile)
8. [Build and Start Containers](#8-build-and-start-containers)
9. [Configure DNS (Domain to EC2)](#9-configure-dns-domain-to-ec2)
10. [Configure Clerk Dashboard](#10-configure-clerk-dashboard)
11. [Set Up AWS Billing Alert](#11-set-up-aws-billing-alert)
12. [Maintenance, Logs, Redeployment & Stopping](#12-maintenance-logs-redeployment--stopping)

---

## 1. Launch EC2 Instance & Security Group

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to **EC2** > **Instances** > **Launch instances**.
3. **Name**: `mindcourse-web` (or your preferred name).
4. **AMI**: Select **Ubuntu** (Ubuntu Server 24.04 LTS or 22.04 LTS, 64-bit x86).
5. **Instance type**: `t3.micro` (eligible for AWS Free Tier).
6. **Key pair**: Select an existing key pair or create a new one (e.g. `mindcourse-key.pem`). Save the `.pem` file safely on your computer.
7. **Network settings (Security Group)**:
   Create a new security group with these inbound rules:
   * **SSH**: Port `22` | Source: **My IP** (never open SSH to `0.0.0.0/0` for security).
   * **HTTP**: Port `80` | Source: **Anywhere (0.0.0.0/0)** (for ACME challenge and HTTP redirection).
   * **HTTPS**: Port `443` | Source: **Anywhere (0.0.0.0/0)** (for secure user traffic).
8. **Storage**: Keep default 8 GiB or increase to 15–20 GiB gp3 (up to 30 GiB is free tier eligible).
9. Click **Launch instance**.
10. *(Recommended)* Go to **EC2** > **Network & Security** > **Elastic IPs** and allocate an Elastic IP, then associate it with your new instance. This ensures your server IP doesn't change when restarted.

---

## 2. Connect to the EC2 Instance

On your local machine (macOS/Linux/WSL/PowerShell):

```bash
# Secure key permissions
chmod 400 mindcourse-key.pem

# SSH into Ubuntu instance
ssh -i "mindcourse-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

## 3. Recommended: Add Swap Space (Crucial for t3.micro)

> [!TIP]
> A `t3.micro` has 1 GB of physical RAM. Running `npm run build` or Docker builds can trigger the Linux Out-Of-Memory (OOM) killer. Adding a 2 GB swap file prevents build crashes.

Run these commands on the server:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 4. Install Docker & Docker Compose Plugin

Run the official Docker installation script on the Ubuntu server:

```bash
# Update package lists
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow running docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## 5. Clone or Copy the Project

Clone your repository to the server:

```bash
cd ~
git clone <YOUR_GIT_REPO_URL> app
cd app
```

Or switch to the deployment branch if needed:
```bash
git checkout docker-aws-deploy
```

---

## 6. Configure Environment Variables (`.env`)

Create your production `.env` file on the server using the template:

```bash
cp .env.example .env
nano .env
```

Fill in your actual production values:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
CLERK_SECRET_KEY=sk_live_...
DATABASE_URL=postgresql://user:password@host:5432/mindcourse?sslmode=require
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...
YOUTUBE_API_KEY=...
REDIS_URL=
NODE_ENV=production
PORT=3000
```
Save and exit `nano` (`Ctrl+O`, `Enter`, `Ctrl+X`).

> [!CAUTION]
> Never commit this `.env` file to git. It stays strictly on the server.

---

## 7. Configure Domain in Caddyfile

Edit the `Caddyfile` on the server:

```bash
nano Caddyfile
```

Replace `YOUR_DOMAIN` with your actual registered domain (e.g., `course.yourdomain.com` or `yourdomain.com`):

```caddyfile
yourdomain.com {
    reverse_proxy web:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

Save and exit.

---

## 8. Build and Start Containers

Launch the multi-container application:

```bash
docker compose up -d --build
```

Verify that both containers (`web` and `caddy`) are healthy and running:

```bash
docker compose ps
```

---

## 9. Configure DNS (Domain to EC2)

1. Log into your domain registrar/DNS provider (Cloudflare, Namecheap, Route 53, GoDaddy, etc.).
2. Add an **A Record**:
   * **Name / Host**: `@` (or subdomain, e.g. `course`)
   * **Value / IP**: `<YOUR_EC2_PUBLIC_IPV4_OR_ELASTIC_IP>`
   * **TTL**: Auto or 300 seconds
3. *(Optional)* Add a `www` CNAME or A record pointing to the same domain/IP if you want `www.yourdomain.com` supported.
4. Once DNS propagates, Caddy will automatically negotiate an SSL certificate with Let's Encrypt and serve HTTPS.

---

## 10. Configure Clerk Dashboard

Since Clerk uses domain authentication:

1. Open your [Clerk Dashboard](https://dashboard.clerk.com).
2. Select your application and click **Configure** > **Domains**.
3. Click **Add domain** and enter your production domain (e.g. `yourdomain.com`).
4. Follow Clerk's DNS verification instructions (add the required CNAME records at your DNS provider).
5. In **API Keys**, ensure you copy the production keys (`pk_live_...` and `sk_live_...`) into your server's `.env`.

---

## 11. Set Up AWS Billing Alert

Avoid surprise cloud costs by configuring AWS Budgets and Billing Alarms:

1. In the AWS Console, search for **Billing and Cost Management**.
2. Go to **Budgets** (or **Cost Management** > **Budgets**).
3. Click **Create budget**:
   * Select **Cost budget (Recommended)**.
   * Period: **Monthly**.
   * Budget amount: e.g., `$5.00` (or your chosen budget limit).
4. Under **Alerts**, add an alert:
   * When actual cost is greater than `80%` (e.g., $4.00), send an email to your address.
   * Add a second alert at `100%`.
5. Click **Create budget**.
6. Also check **Billing Preferences** and ensure **Receive Billing Alerts** is checked.

---

## 12. Maintenance, Logs, Redeployment & Stopping

### View Logs
```bash
# View combined live logs
docker compose logs -f

# View web app logs only
docker compose logs -f web

# View Caddy logs only
docker compose logs -f caddy
```

### Redeploy Updates
When you push new changes to GitHub:
```bash
cd ~/app
git pull origin main
docker compose up -d --build
```

### Clean Up Unused Docker Images/Layers
Periodically reclaim disk space:
```bash
docker image prune -f
```

### Stop Containers (Keep EC2 running)
```bash
docker compose down
```

### Stop or Terminate EC2 Instance (Avoid AWS Charges)
* **Stop Instance**: If not using the app, go to EC2 Console > Instances > Select instance > **Instance state** > **Stop instance**. (You will not incur compute charges, only minimal EBS storage costs).
* **Terminate Instance**: To permanently delete the instance and release all associated resources, select **Terminate instance**.
