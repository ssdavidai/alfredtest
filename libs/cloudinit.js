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
  - cd /opt/alfred
  # Generate secrets
  - export VM_ENCRYPTION_SECRET=$(openssl rand -base64 32)
  - export VM_AUTH_SECRET=${authSecret}
  # Create docker-compose.yml
  - |
    cat > docker-compose.yml << 'EOF'
    version: '3.8'
    services:
      async-agent:
        image: ghcr.io/alfred/async-agent:latest
        ports:
          - "3000:3000"
        environment:
          - VM_ENCRYPTION_SECRET
          - VM_AUTH_SECRET
      postgres:
        image: postgres:16-alpine
        environment:
          - POSTGRES_PASSWORD=alfredlocal
      caddy:
        image: caddy:2-alpine
        ports:
          - "80:80"
          - "443:443"
    EOF
  - docker-compose up -d
`;
}
