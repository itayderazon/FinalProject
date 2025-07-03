# Docker Setup for Nutrition App

This guide explains how to run the entire Nutrition App system using Docker containers.

## Services Overview

The application consists of 4 services:

1. **PostgreSQL Database** - Data storage
2. **NodeServer** - Express.js API backend (port 3001)
3. **PythonServer** - FastAPI nutrition service (port 8000)
4. **Web** - React frontend served by Nginx (port 80)

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 80, 3001, 5432, and 8000 available

## Quick Start

### 1. Run the entire system with one command:

```bash
docker-compose up --build
```

This will:
- Build all services from source
- Start PostgreSQL database
- Start NodeServer (waits for database to be ready)
- Start PythonServer
- Start Web frontend
- Set up networking between all services

### 2. Access the application:

- **Frontend**: http://localhost
- **NodeServer API**: http://localhost:3001
- **PythonServer API**: http://localhost:8000
- **Database**: localhost:5432

## Development Commands

### Build and run in background:
```bash
docker-compose up --build -d
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nodeserver
docker-compose logs -f pythonserver
docker-compose logs -f web
```

### Stop all services:
```bash
docker-compose down
```

### Stop and remove volumes (clean database):
```bash
docker-compose down -v
```

### Rebuild specific service:
```bash
docker-compose build nodeserver
docker-compose up nodeserver
```

## Service Details

### NodeServer (Express.js)
- **Port**: 3001
- **Health check**: GET /health
- **Environment**: Production mode
- **Database**: Connects to PostgreSQL container

### PythonServer (FastAPI)
- **Port**: 8000
- **Health check**: GET /health
- **API Docs**: http://localhost:8000/docs

### Web Frontend (React + Nginx)
- **Port**: 80
- **Built with**: Vite
- **Proxy**: API requests automatically forwarded to NodeServer

### PostgreSQL Database
- **Port**: 5432
- **Database**: nutrition_app
- **User**: nutrition_user
- **Password**: nutrition_password

## Environment Configuration

The `docker-compose.yml` includes all necessary environment variables. 

For production, update these values:
- JWT_SECRET
- Database credentials
- CORS origins

## Troubleshooting

### Port conflicts:
If ports are in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change 80 to 8080
```

### Database connection issues:
1. Check if PostgreSQL is healthy:
```bash
docker-compose ps
```

2. View database logs:
```bash
docker-compose logs postgres
```

### Service won't start:
1. Check logs for the specific service
2. Ensure all dependencies are met
3. Try rebuilding:
```bash
docker-compose build --no-cache <service-name>
```

### Clear everything and start fresh:
```bash
docker-compose down -v
docker system prune -f
docker-compose up --build
```

## Production Deployment

For production deployment:

1. Update environment variables in `docker-compose.yml`
2. Set up proper SSL/TLS termination
3. Configure external database if needed
4. Set up monitoring and logging
5. Consider using Docker Swarm or Kubernetes for orchestration

## File Structure

```
.
├── docker-compose.yml          # Main orchestration file
├── NodeServer/
│   ├── Dockerfile
│   └── .dockerignore
├── PythonServer/
│   ├── Dockerfile
│   └── .dockerignore
├── Web/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
└── DOCKER_README.md
``` 