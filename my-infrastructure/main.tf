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

resource "azurerm_storage_account" "practice" {
  name                     = "practiceaccountteamb"
  resource_group_name      = "rg-terraform-state-team-b-brilliant"
  location                 = "uksouth"
  account_tier             = "Standard"
  account_replication_type = "LRS"

  allow_nested_items_to_be_public = false

  tags = {
    team        = "team b for brilliant"
    environment = "dev"
  }
}

module "resource_group" {
  source = "./modules/resource-group"

  name     = var.resource_group_name
  location = var.location
  tags = {
    Environment = var.environment
    Project     = "brilliant-backend"
  }
}

moved {
  from = azurerm_resource_group.backend
  to   = module.resource_group.azurerm_resource_group.this
}

resource "terraform_data" "secret_storage" {
  input = var.secret_value
}
