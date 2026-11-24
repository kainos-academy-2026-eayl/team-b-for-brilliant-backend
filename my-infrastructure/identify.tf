resource "azurerm_user_assigned_identity" "apps" {
  name                = "id-brilliant-${var.environment}"
  location            = azurerm_resource_group.backend.location
  resource_group_name = azurerm_resource_group.backend.name

  tags = {
    Environment = var.environment
    Project     = "brilliant-backend"
  }
}

resource "azurerm_role_assignment" "kv_secrets_user" {
  scope                = azurerm_key_vault.backend.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.apps.principal_id
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = data.azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.apps.principal_id
}
