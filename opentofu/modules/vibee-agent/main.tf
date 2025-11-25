# VIBEE Agent Module - ElizaOS Telegram Bot Deployment

terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

# Create vibee-network if it doesn't exist
resource "docker_network" "vibee_network" {
  name = "vibee-network"
  ipam_config {
    subnet = "172.20.0.0/16"
  }
}

# PostgreSQL Container (if not using external database)
resource "docker_container" "postgres" {
  name  = "vibee-postgres-${var.environment}"
  image = "ankane/pgvector:latest"

  env = [
    "POSTGRES_PASSWORD=postgres",
    "POSTGRES_USER=postgres",
    "POSTGRES_DB=eliza",
    "PGDATA=/var/lib/postgresql/data/pgdata"
  ]

  volumes {
    volume_name    = docker_volume.postgres_data.name
    container_path = "/var/lib/postgresql/data"
  }

  ports {
    external = 5432
    internal = 5432
    ip       = "127.0.0.1" # Only localhost access
    protocol = "tcp"
  }

  healthcheck {
    test         = ["CMD-SHELL", "pg_isready -U postgres -d eliza"]
    interval     = "10s"
    timeout      = "5s"
    retries      = 5
    start_period = "30s"
  }

  networks_advanced {
    name         = "vibee-network"
    ipv4_address = "172.20.0.10"
  }

  restart     = "unless-stopped"
  must_run    = true
}

# PostgreSQL Volume
resource "docker_volume" "postgres_data" {
  name = "vibee-postgres-data-${var.environment}"
}

# Build VIBEE Agent Docker Image
resource "null_resource" "vibee_agent_build" {
  provisioner "local-exec" {
    command = <<-EOT
      docker build -t vibee/agent:${var.environment}-latest \
        --build-arg NODE_ENV=${var.environment} \
        -f Dockerfile \
        .
    EOT

    working_dir = "${path.module}/../../../"
  }

  # Rebuild when source code changes
  triggers = {
    source_md5 = md5("${path.module}/../../../src")
    dockerfile_md5 = md5("${path.module}/../../../Dockerfile")
    package_json_md5 = md5("${path.module}/../../../package.json")
    always_run = timestamp()
  }
}

# VIBEE Agent Container
resource "docker_container" "vibee_agent" {
  name  = "vibee-agent-${var.environment}"
  image = "vibee/agent:${var.environment}-latest"

  # Working directory
  working_dir = "/app"

  # Environment variables (Cloud-First: Infisical)
  env = [
    "NODE_ENV=${var.environment}",
    "INFISICAL_CLIENT_ID=${var.infisical_client_id}",
    "INFISICAL_CLIENT_SECRET=${var.infisical_client_secret}",
    "INFISICAL_PROJECT_ID=${var.infisical_project_id}",
    "INFISICAL_ENVIRONMENT=${var.infisical_environment}",
    "POSTGRES_URL=${var.postgres_url != null ? var.postgres_url : "postgresql://postgres:postgres@vibee-postgres-${var.environment}:5432/eliza"}",
    "SERVER_PORT=3000",
    "ELIZA_UI_ENABLE=true",
    "LOG_LEVEL=info"
  ]

  # Network configuration
  networks_advanced {
    name         = "vibee-network"
    ipv4_address = "172.20.0.20"
  }

  # Port mapping
  ports {
    external = var.agent_port
    internal = 3000
    ip       = "0.0.0.0"
    protocol = "tcp"
  }

  # Health check
  healthcheck {
    test         = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
    interval     = "30s"
    timeout      = "10s"
    retries      = 3
    start_period = "90s" # Give more time for Infisical secrets loading and DB connection
  }

  # Dependencies
  depends_on = [
    docker_container.postgres,
    null_resource.vibee_agent_build
  ]

  # Wait for PostgreSQL to be ready before starting
  lifecycle {
    create_before_destroy = true
  }

  # Restart policy
  restart = "unless-stopped"

  # Keep container running
  must_run = true
}

