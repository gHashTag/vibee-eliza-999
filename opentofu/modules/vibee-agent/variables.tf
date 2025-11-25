# VIBEE Agent Module Variables

variable "server_ip" {
  description = "Server External IP"
  type        = string
}

variable "environment" {
  description = "Deployment environment (stage, production)"
  type        = string
  default     = "stage"
}

variable "agent_port" {
  description = "VIBEE Agent HTTP Port"
  type        = number
  default     = 3000
}

# Infisical Configuration
variable "infisical_client_id" {
  description = "Infisical Client ID"
  type        = string
  sensitive   = true
}

variable "infisical_client_secret" {
  description = "Infisical Client Secret"
  type        = string
  sensitive   = true
}

variable "infisical_project_id" {
  description = "Infisical Project ID"
  type        = string
}

variable "infisical_environment" {
  description = "Infisical Environment (dev, stage, production)"
  type        = string
  default     = "stage"
}

# Database Configuration
variable "postgres_url" {
  description = "PostgreSQL connection URL (optional, defaults to internal container)"
  type        = string
  default     = null
}

variable "network_subnet" {
  description = "Docker Network Subnet"
  type        = string
  default     = "172.20.0.0/16"
}

variable "agent_ip_address" {
  description = "IP Address for VIBEE Agent container"
  type        = string
  default     = "172.20.0.20"
}

variable "postgres_ip_address" {
  description = "IP Address for PostgreSQL container"
  type        = string
  default     = "172.20.0.10"
}

