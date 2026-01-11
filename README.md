# AT_Honeypot (Web & SSH)

## Overview:
This project is a dual-layered honeypot designed to mimic an internal service for Algérie Télécom :) . It serves as a security research tool to observe, log, and analyze unauthorized access attempts in real-time.

The system consists of two main components:
- **Web Honeypot**: A deceptive "Internal HR Portal" that captures login credentials and attacker attempts.
- **SSH Honeypot**: A high-interaction deceptive SSH service that logs brute-force attempts and terminal commands.

## Architecture
The project is fully containerized using Docker for easy deployment and isolation.
- **Web** : Node.js + Express.js
- **SSH Service** : Python-based Paramiko server.
- **Logging**: volumes are used to persist data from containers to the `./logs` host directory.

## How to Run

### Prerequisites
[Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
#### Installation & Deployment
```
git clone <URL>
cd at_honeypot
docker-compose up --build
```
## Testing the Honeypot
- run nmap scan
#### 1. Web Attack (Port 80)
- Navigate to http://localhost:80 in your browser
#### 2. SSH Attack (Port 22)
- Open a terminal and attempt to connect to the fake SSH server
`ssh admin@localhost -p 22`

- **Note**: If you see a *"Host Identification Changed"* error, run `ssh-keygen -R localhost` to clear your local cache


## Log Analysis
The system is configured to save all "attacker" activity directly into the project folder for easy review:
- **Web Logs**: `./logs/web/`  Contains HTTP request data, IP, stolen credentials and payloads ...
- **SSH Logs**: `./logs/ssh/`  Contains connection timestamps, IP addresses, and attempted passwords ...

## Troubleshooting
- **Port Conflict**: Ensure no other service is running on ports `80` or `22`.

  else change the **left-side** number to an unused port in `docker-compose.yml` (e.g `1234:2222`)
- **Persistence**: If logs do not appear immediately, ensure you have `write` permissions in the project directory.
