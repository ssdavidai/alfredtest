/**
 * Cloud-init configuration generator for Alfred VM provisioning
 * Generates cloud-config YAML for automated VM setup
 */

export function generateCloudInit(subdomain, authSecret) {
  const fullDomain = `${subdomain}.alfredos.site`;

  return `#cloud-config
package_update: true
packages:
  - docker.io
  - docker-compose
  - curl

write_files:
  # Main .env file with all secrets (will be populated by setup script)
  - path: /opt/alfred/.env
    permissions: '0600'
    content: |
      VM_AUTH_SECRET=${authSecret}
      VM_ENCRYPTION_SECRET=PLACEHOLDER_ENCRYPTION
      LIBRECHAT_JWT_SECRET=PLACEHOLDER_JWT
      CREDS_KEY=PLACEHOLDER_CREDS_KEY
      CREDS_IV=PLACEHOLDER_CREDS_IV
      DATABASE_URL=postgresql://alfred:alfredlocal@postgres:5432/alfred

  # Docker Compose configuration
  - path: /opt/alfred/docker-compose.yml
    permissions: '0644'
    content: |
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
          image: ghcr.io/ssdavidai/alfred-async-agent:latest
          container_name: alfred-async-agent
          networks:
            - alfred-network
          env_file:
            - .env
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
          env_file:
            - .env
          environment:
            - HOST=0.0.0.0
            - PORT=3080
            - MONGO_URI=mongodb://mongo:27017/LibreChat
            - DOMAIN_CLIENT=https://${fullDomain}
            - DOMAIN_SERVER=https://${fullDomain}
            - ALLOW_REGISTRATION=true
          depends_on:
            mongo:
              condition: service_healthy
          restart: unless-stopped
          healthcheck:
            test: ["CMD", "curl", "-f", "http://localhost:3080/api/health"]
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

  # Caddyfile for reverse proxy with TLS
  - path: /opt/alfred/Caddyfile
    permissions: '0644'
    content: |
      ${fullDomain} {
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
          Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
          X-Frame-Options "SAMEORIGIN"
          X-Content-Type-Options "nosniff"
          X-XSS-Protection "1; mode=block"
          Referrer-Policy "strict-origin-when-cross-origin"
        }

        log {
          output file /var/log/caddy/access.log
          format json
        }
      }

  # Setup script that runs after boot
  - path: /opt/alfred/setup.sh
    permissions: '0755'
    content: |
      #!/bin/bash
      set -e

      cd /opt/alfred

      echo "=== Alfred VM Setup Starting ==="

      # Generate real secrets and update .env file
      echo "Generating secrets..."
      VM_ENCRYPTION_SECRET=$(openssl rand -base64 32)
      LIBRECHAT_JWT_SECRET=$(openssl rand -base64 32)
      CREDS_KEY=$(openssl rand -base64 32)
      CREDS_IV=$(openssl rand -base64 16)

      # Read existing VM_AUTH_SECRET from .env
      VM_AUTH_SECRET=$(grep VM_AUTH_SECRET /opt/alfred/.env | cut -d= -f2)

      # Rewrite .env with real secrets
      cat > /opt/alfred/.env << ENVFILE
      VM_AUTH_SECRET=$VM_AUTH_SECRET
      VM_ENCRYPTION_SECRET=$VM_ENCRYPTION_SECRET
      LIBRECHAT_JWT_SECRET=$LIBRECHAT_JWT_SECRET
      JWT_SECRET=$LIBRECHAT_JWT_SECRET
      JWT_REFRESH_SECRET=$LIBRECHAT_JWT_SECRET
      CREDS_KEY=$CREDS_KEY
      CREDS_IV=$CREDS_IV
      DATABASE_URL=postgresql://alfred:alfredlocal@postgres:5432/alfred
      ENVFILE

      echo "Secrets generated and saved to .env"

      # Create log directory for Caddy
      mkdir -p /var/log/caddy

      # Start Docker services
      echo "Starting Docker services..."
      docker-compose up -d

      # Wait for services to be healthy
      echo "Waiting for services to start (60 seconds)..."
      sleep 60

      # Show service status
      echo "Service status:"
      docker-compose ps

      # Register with SaaS platform
      echo "Registering VM with SaaS platform..."
      REGISTER_RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST https://alfred.rocks/api/vm/register \\
        -H "Content-Type: application/json" \\
        -d "{\\"subdomain\\": \\"${subdomain}\\", \\"authSecret\\": \\"$VM_AUTH_SECRET\\"}")

      HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
      RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | head -n-1)

      if [ "$HTTP_CODE" = "200" ]; then
        echo "VM registered successfully!"
        echo "Response: $RESPONSE_BODY"
      else
        echo "VM registration failed with HTTP $HTTP_CODE"
        echo "Response: $RESPONSE_BODY"
        # Don't exit with error - services are still running
      fi

      echo "=== Alfred VM Setup Complete ==="
      echo "Services available at: https://${fullDomain}"

runcmd:
  - systemctl enable docker
  - systemctl start docker
  - /opt/alfred/setup.sh
`;
}
