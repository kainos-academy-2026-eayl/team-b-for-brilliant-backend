resource "azurerm_user_assigned_identity" "apps" {
  name                = "id-brilliant-${var.environment}"
  location            = azurerm_resource_group.backend.location
  resource_group_name = azurerm_resource_group.backend.name

  tags = {
    Environment = var.environment
    Project     = "brilliant-backend"
  }
}
