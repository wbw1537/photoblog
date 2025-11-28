# Docker Deployment Guide

This guide explains how to deploy the Photoblog application using Docker.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 2.0 or higher

## Quick Start

### For Users

1. **Download the deployment files**
   ```bash
   # Download docker-compose.yml and .env.example
   curl -O https://raw.githubusercontent.com/yourusername/photoblog/main/docker-compose.yml
   curl -O https://raw.githubusercontent.com/yourusername/photoblog/main/.env.example
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred editor
   nano .env
   ```

   **Important:** Update these values:
   - `DOCKER_IMAGE`: Set to the actual image name (e.g., `yourusername/photoblog:latest`)
   - `MYSQL_ROOT_PASSWORD`: Strong password for MySQL root
   - `MYSQL_PASSWORD`: Strong password for the application database user
   - `JWT_SECRET`: Generate a secure random string (e.g., use `openssl rand -base64 32`)

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Verify it's running**
   ```bash
   docker-compose ps
   docker-compose logs -f app
   ```

5. **Access the application**
   - Application: `http://localhost:8000`
   - Database: `localhost:3306` (if needed for external access)

### Stopping the Application

```bash
docker-compose down
```

To also remove volumes (WARNING: deletes all data):
```bash
docker-compose down -v
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Internal application port | `3000` | No |
| `APP_PORT` | External port to access app | `8000` | No |
| `MYSQL_ROOT_PASSWORD` | MySQL root password | - | Yes |
| `MYSQL_DATABASE` | Database name | `photoblog_db` | Yes |
| `MYSQL_USER` | Database user | `photoblog_user` | Yes |
| `MYSQL_PASSWORD` | Database password | - | Yes |
| `JWT_SECRET` | Secret for JWT tokens | - | Yes |
| `JWT_EXPIRATION` | JWT expiration time | `1h` | No |
| `DOCKER_IMAGE` | Docker image to use | `yourusername/photoblog:latest` | Yes |

### Ports

- `APP_PORT` (default 8000): Application HTTP port
- `MYSQL_PORT` (default 3306): MySQL database port

Change these in `.env` if you have conflicts.

## Data Persistence

Database data is stored in a Docker volume named `photoblog-db-data`. This persists even when containers are stopped or recreated.

To backup your database:
```bash
docker-compose exec db mysqldump -u root -p$MYSQL_ROOT_PASSWORD photoblog_db > backup.sql
```

To restore:
```bash
docker-compose exec -T db mysql -u root -p$MYSQL_ROOT_PASSWORD photoblog_db < backup.sql
```

## Updating

To update to a new version:

```bash
# Pull the latest image
docker-compose pull

# Restart services
docker-compose up -d
```

Database migrations will run automatically on startup.

## Troubleshooting

### Check logs
```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# Database only
docker-compose logs -f db
```

### Database connection issues
```bash
# Check if database is healthy
docker-compose ps

# Test database connection
docker-compose exec db mysql -u root -p
```

### Reset everything (WARNING: deletes all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Advanced Usage

### Using a specific version
Edit `.env` and change:
```env
DOCKER_IMAGE=yourusername/photoblog:v1.0.0
```

### Custom network
The compose file creates an isolated network (`photoblog-network`). To connect other services:
```yaml
services:
  my-service:
    networks:
      - photoblog-network

networks:
  photoblog-network:
    external: true
```

---

## For Developers

### Building the Image Locally

```bash
docker build -t photoblog:local .
```

### Testing Locally

```bash
# Update .env to use local image
DOCKER_IMAGE=photoblog:local

# Run
docker-compose up -d
```

### Publishing a Release

1. **Create a version tag**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions automatically:**
   - Builds the Docker image
   - Pushes to Docker Hub with tags:
     - `v1.0.0`
     - `1.0`
     - `1`
     - `latest` (if on main branch)

3. **Setup required secrets in GitHub:**
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password or access token

### Multi-platform Support

The GitHub Actions workflow builds for both `linux/amd64` and `linux/arm64` architectures automatically.
