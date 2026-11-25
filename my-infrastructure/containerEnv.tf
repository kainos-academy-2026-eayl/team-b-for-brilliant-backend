resource "azurerm_container_app_environment" "backend" {
  name                = "cae-team-b-brilliant-${var.environment}"
  location            = azurerm_resource_group.backend.location
  resource_group_name = azurerm_resource_group.backend.name

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.apps.id]
  }

  tags = {
    Environment = var.environment
    Project     = "brilliant-backend"
  }
}
