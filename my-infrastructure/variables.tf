variable "subscription_id" {
  description = "Azure subscription ID where the backend resource group will be created."
  type        = string
}

variable "resource_group_name" {
  description = "Optional name for the backend Azure resource group."
  type        = string
  default     = null

  validation {
    condition = var.resource_group_name == null ? true : (
      length(var.resource_group_name) >= 1 &&
      length(var.resource_group_name) <= 90 &&
      can(regex("^[A-Za-z0-9._()-]+$", var.resource_group_name)) &&
      !endswith(var.resource_group_name, ".")
    )
    error_message = "Use 1-90 letters, numbers, periods, underscores, parentheses, or hyphens; the name cannot end with a period."
  }
}

variable "location" {
  description = "Azure region for the resource group, such as uksouth or eastus."
  type        = string
  default     = "uksouth"
}

variable "environment" {
  description = "Deployment environment used to tag the resource group."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "environment must be dev, test, or prod."
  }
}


variable "key_vault_name" {
  description = "Optional globally unique name for the Key Vault (3-24 letters, numbers, hyphens)."
  type        = string
  default     = null

  validation {
    condition     = var.key_vault_name == null ? true : can(regex("^[A-Za-z][A-Za-z0-9-]{1,22}[A-Za-z0-9]$", var.key_vault_name))
    error_message = "Key Vault name must be 3-24 characters, start with a letter, end with a letter or number, and contain only letters, numbers, and hyphens."
  }
}

variable "acr_name" {
  description = "Name of the existing Azure Container Registry the identity pulls images from."
  type        = string
}

variable "acr_resource_group_name" {
  description = "Resource group containing the existing Azure Container Registry."
  type        = string
}

variable "key_vault_purge_protection_enabled" {
  description = "Enable purge protection on the Key Vault. Cannot be disabled once enabled."
  type        = bool
  default     = false
}

variable "backend_image" {
  description = "Backend image repository and tag, for example brilliant-backend:v1."
  type        = string
}

variable "frontend_image" {
  description = "Frontend image repository and tag, for example brilliant-frontend:v1."
  type        = string
}

variable "frontend_origin" {
  description = "Public frontend origin for backend CORS, for example https://shop.example.com."
  type        = string
  default     = "https://temp-shop.example.com"
}
