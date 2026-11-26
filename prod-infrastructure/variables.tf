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
  description = "Azure location for the backend resource group."
  type        = string
  default     = "uksouth"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, prod)."
  type        = string
  default     = "prod"
}
