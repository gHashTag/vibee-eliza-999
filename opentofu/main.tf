# Main OpenTofu Configuration for VIBEE Agent Infrastructure
# Deploys VIBEE Agent (ElizaOS Telegram Bot) to Stage environment

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
  required_version = ">= 1.0"
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# Backend configuration (local for now, can be changed to remote)
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}

# VIBEE Agent Module
module "vibee_agent" {
  source = "./modules/vibee-agent"

  server_ip    = var.server_ip
  environment  = var.environment
  agent_port   = 3001  # Изменено с 3000, т.к. порт занят Grafana

  # Infisical Configuration (secrets loaded from Infisical Cloud)
  infisical_client_id     = var.infisical_client_id
  infisical_client_secret = var.infisical_client_secret
  infisical_project_id    = var.infisical_project_id
  infisical_environment   = var.infisical_environment

  # Database Configuration
  postgres_url = var.postgres_url
}

# Network configuration
output "infrastructure_urls" {
  value = {
    vibee_agent = "http://${var.server_ip}:3001"
    health      = "http://${var.server_ip}:3001/health"
  }
}

output "vibee_agent_info" {
  value = {
    server_url = "http://${var.server_ip}:3001"
    health_url = "http://${var.server_ip}:3001/health"
    status     = "Ready for deployment"
    environment = var.environment
  }
}

