terraform {
  backend "azurerm" {
    storage_account_name = "teamb4brilliant"
    container_name       = "tfstate"
    key                  = "brilliant-backend-dev.tfstate"

    use_azuread_auth = true
    use_cli          = true
  }
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

locals {
  resource_group_name = var.resource_group_name != null ? var.resource_group_name : "rg-brilliant-backend-${var.environment}"
}

moved {
  from = module.resource_group.azurerm_resource_group.this
  to   = azurerm_resource_group.backend
}

resource "azurerm_resource_group" "backend" {
  name     = local.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "brilliant-backend"
  }
}
