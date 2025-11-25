# VIBEE Agent Module Outputs

output "vibee_agent_container_id" {
  description = "VIBEE Agent Container ID"
  value       = docker_container.vibee_agent.id
}

output "postgres_container_id" {
  description = "PostgreSQL Container ID"
  value       = docker_container.postgres.id
}

output "vibee_network_id" {
  description = "Vibee Network ID"
  value       = docker_network.vibee_network.id
}

output "vibee_agent_url" {
  description = "VIBEE Agent HTTP URL"
  value       = "http://${var.server_ip}:${var.agent_port}"
}

output "vibee_agent_health_url" {
  description = "VIBEE Agent Health Check URL"
  value       = "http://${var.server_ip}:${var.agent_port}/health"
}

output "vibee_agent_ip" {
  description = "VIBEE Agent Internal IP"
  value       = "172.20.0.20"  # Fixed IP from networks_advanced
}

output "postgres_ip" {
  description = "PostgreSQL Internal IP"
  value       = "172.20.0.10"  # Fixed IP from networks_advanced
}

output "postgres_url" {
  description = "PostgreSQL Connection URL"
  value       = var.postgres_url != null ? var.postgres_url : "postgresql://postgres:postgres@vibee-postgres-${var.environment}:5432/eliza"
  sensitive   = true
}

