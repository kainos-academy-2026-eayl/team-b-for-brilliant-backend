# Manages the existing remote-state storage used by my-infrastructure and prod-infrastructure.
# State for this config is local (gitignored); keep terraform.tfstate somewhere safe.
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id     = var.subscription_id
  storage_use_azuread = true
}

locals {
  resource_group_name  = "rg-terraform-state-team-b-brilliant"
  storage_account_name = "teamb4brilliant"
  container_name       = "tfstate"

  resource_group_id  = "/subscriptions/${var.subscription_id}/resourceGroups/${local.resource_group_name}"
  storage_account_id = "${local.resource_group_id}/providers/Microsoft.Storage/storageAccounts/${local.storage_account_name}"
}

import {
  to = azurerm_resource_group.tfstate
  id = local.resource_group_id
}

import {
  to = azurerm_storage_account.tfstate
  id = local.storage_account_id
}

import {
  to = azurerm_storage_container.tfstate
  id = "${local.storage_account_id}/blobServices/default/containers/${local.container_name}"
}

resource "azurerm_resource_group" "tfstate" {
  name     = local.resource_group_name
  location = var.location

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_storage_account" "tfstate" {
  name                            = local.storage_account_name
  resource_group_name             = azurerm_resource_group.tfstate.name
  location                        = azurerm_resource_group.tfstate.location
  account_kind                    = "StorageV2"
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  # Still enabled in Azure; switch to false only once nothing relies on access keys.
  shared_access_key_enabled = true

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 7
    }

    container_delete_retention_policy {
      days = 7
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_storage_container" "tfstate" {
  name                  = local.container_name
  storage_account_id    = azurerm_storage_account.tfstate.id
  container_access_type = "private"

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_role_assignment" "tfstate_rw" {
  for_each             = toset(var.state_writer_principal_ids)
  scope                = azurerm_storage_account.tfstate.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = each.value
}
