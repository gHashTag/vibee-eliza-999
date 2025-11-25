# Main Variables for VIBEE Agent Deployment

variable "server_ip" {
  description = "External IP address of the server"
  type        = string
  default     = "188.137.250.63"
}

variable "environment" {
  description = "Deployment environment (stage, production)"
  type        = string
  default     = "stage"
}

# Infisical Configuration (Cloud-First Secret Management)
variable "infisical_client_id" {
  description = "Infisical Client ID"
  type        = string
  sensitive   = true
  default     = null
}

variable "infisical_client_secret" {
  description = "Infisical Client Secret"
  type        = string
  sensitive   = true
  default     = null
}

variable "infisical_project_id" {
  description = "Infisical Project ID"
  type        = string
  default     = null
}

variable "infisical_environment" {
  description = "Infisical Environment (dev, stage, production)"
  type        = string
  default     = "stage"
}

# Database Configuration
variable "postgres_url" {
  description = "PostgreSQL connection URL"
  type        = string
  sensitive   = true
  default     = null
}

