resource "azurerm_container_app_environment" "backend" {
  name                = "cae-team-b-brilliant-${var.environment}"
  location            = azurerm_resource_group.backend.location
  resource_group_name = azurerm_resource_group.backend.name

  tags = {
    Environment = var.environment
    Project     = "brilliant-backend"
  }
}