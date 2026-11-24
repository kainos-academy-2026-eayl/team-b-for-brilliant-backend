data "azurerm_client_config" "current" {}

locals {
  key_vault_name = var.key_vault_name != null ? var.key_vault_name : "kv-brilliant-be-${var.environment}"
}

resource "azurerm_key_vault" "backend" {
  name                = local.key_vault_name
  location            = azurerm_resource_group.backend.location
  resource_group_name = azurerm_resource_group.backend.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  rbac_authorization_enabled = true
  purge_protection_enabled   = var.key_vault_purge_protection_enabled
  soft_delete_retention_days = 7

  tags = {
    Environment = var.environment
    Project     = "brilliant-backend"
  }
}
