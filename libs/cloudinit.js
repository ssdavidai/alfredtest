/**
 * Cloud-init configuration generator for Alfred VM provisioning
 * Generates cloud-config YAML for automated VM setup
 */

export function generateCloudInit(subdomain, authSecret) {
  return `#cloud-config
package_update: true
packages:
  - docker.io
  - docker-compose

runcmd:
  - systemctl enable docker
  - systemctl start docker
  - mkdir -p /opt/alfred
  - mkdir -p /opt/alfred/data/postgres
  - mkdir -p /opt/alfred/data/mongo
  - mkdir -p /opt/alfred/data/nocodb
  - mkdir -p /opt/alfred/data/caddy
  - mkdir -p /opt/alfred/librechat
  - cd /opt/alfred
  # Generate secrets
  - export VM_ENCRYPTION_SECRET=$(openssl rand -base64 32)
  - export VM_AUTH_SECRET=${authSecret}
  - export LIBRECHAT_JWT_SECRET=$(openssl rand -base64 32)
  - export CREDS_KEY=$(openssl rand -base64 32)
  - export CREDS_IV=$(openssl rand -base64 16)
  # Create LibreChat .env file
  - |
    cat > librechat/.env << 'ENVEOF'
    HOST=0.0.0.0
    PORT=3080
    MONGO_URI=mongodb://mongo:27017/LibreChat
    DOMAIN_CLIENT=https://${subdomain}
    DOMAIN_SERVER=https://${subdomain}
    JWT_SECRET=\${LIBRECHAT_JWT_SECRET}
    JWT_REFRESH_SECRET=\${LIBRECHAT_JWT_SECRET}
    CREDS_KEY=\${CREDS_KEY}
    CREDS_IV=\${CREDS_IV}
    ALLOW_REGISTRATION=true
    ENVEOF
  # Create docker-compose.yml
  - |
    cat > docker-compose.yml << 'EOF'
    version: '3.8'

    networks:
      alfred-network:
        driver: bridge

    volumes:
      postgres-data:
      mongo-data:
      nocodb-data:
      caddy-data:
      caddy-config:

    services:
      postgres:
        image: postgres:16-alpine
        container_name: alfred-postgres
        networks:
          - alfred-network
        environment:
          POSTGRES_DB: alfred
          POSTGRES_USER: alfred
          POSTGRES_PASSWORD: alfredlocal
        volumes:
          - postgres-data:/var/lib/postgresql/data
        restart: unless-stopped
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U alfred"]
          interval: 10s
          timeout: 5s
          retries: 5

      mongo:
        image: mongo:7
        container_name: alfred-mongo
        networks:
          - alfred-network
        volumes:
          - mongo-data:/data/db
        restart: unless-stopped
        healthcheck:
          test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
          interval: 10s
          timeout: 5s
          retries: 5

      async-agent:
        image: ghcr.io/alfred/async-agent:latest
        container_name: alfred-async-agent
        networks:
          - alfred-network
        environment:
          - VM_ENCRYPTION_SECRET
          - VM_AUTH_SECRET
          - DATABASE_URL=postgresql://alfred:alfredlocal@postgres:5432/alfred
        depends_on:
          postgres:
            condition: service_healthy
        restart: unless-stopped
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
          interval: 30s
          timeout: 10s
          retries: 3

      librechat:
        image: ghcr.io/danny-avila/librechat:latest
        container_name: alfred-librechat
        networks:
          - alfred-network
        ports:
          - "3080:3080"
        environment:
          - HOST=0.0.0.0
          - PORT=3080
          - MONGO_URI=mongodb://mongo:27017/LibreChat
          - DOMAIN_CLIENT=https://${subdomain}
          - DOMAIN_SERVER=https://${subdomain}
          - JWT_SECRET
          - JWT_REFRESH_SECRET
          - CREDS_KEY
          - CREDS_IV
          - ALLOW_REGISTRATION=true
        volumes:
          - ./librechat/.env:/app/.env
        depends_on:
          mongo:
            condition: service_healthy
        restart: unless-stopped
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:3080/health"]
          interval: 30s
          timeout: 10s
          retries: 3

      nocodb:
        image: nocodb/nocodb:latest
        container_name: alfred-nocodb
        networks:
          - alfred-network
        ports:
          - "8080:8080"
        environment:
          - NC_DB=pg://postgres:5432?u=alfred&p=alfredlocal&d=nocodb
        volumes:
          - nocodb-data:/usr/app/data
        depends_on:
          postgres:
            condition: service_healthy
        restart: unless-stopped
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:8080/api/v1/health"]
          interval: 30s
          timeout: 10s
          retries: 3

      caddy:
        image: caddy:2-alpine
        container_name: alfred-caddy
        networks:
          - alfred-network
        ports:
          - "80:80"
          - "443:443"
          - "443:443/udp"
        volumes:
          - ./Caddyfile:/etc/caddy/Caddyfile
          - caddy-data:/data
          - caddy-config:/config
        depends_on:
          - async-agent
          - librechat
          - nocodb
        restart: unless-stopped
    EOF
  # Create Caddyfile
  - |
    cat > Caddyfile << 'CADDYEOF'
    ${subdomain} {
      # LibreChat routes
      handle_path /chat/* {
        reverse_proxy librechat:3080
      }

      # NocoDB routes
      handle_path /db/* {
        reverse_proxy nocodb:8080
      }

      # Default to async-agent
      handle {
        reverse_proxy async-agent:3000
      }

      # Enable compression
      encode gzip

      # Security headers
      header {
        # Enable HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        # Prevent clickjacking
        X-Frame-Options "SAMEORIGIN"
        # Prevent MIME sniffing
        X-Content-Type-Options "nosniff"
        # XSS Protection
        X-XSS-Protection "1; mode=block"
        # Referrer Policy
        Referrer-Policy "strict-origin-when-cross-origin"
      }

      # Logging
      log {
        output file /var/log/caddy/access.log
        format json
      }
    }
    CADDYEOF
  # Start all services
  - docker-compose up -d
  # Wait for services to be healthy
  - sleep 30
  - docker-compose ps
  # Register VM with SaaS platform
  - |
    curl -X POST https://alfred.rocks/api/vm/register \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer \${VM_AUTH_SECRET}" \
      -d '{"subdomain": "${subdomain}", "authSecret": "'\${VM_AUTH_SECRET}'"}'
`;
}
