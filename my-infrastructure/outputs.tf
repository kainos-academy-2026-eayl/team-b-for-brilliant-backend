output "resource_group_name" {
  description = "Name of the backend Azure resource group."
  value       = azurerm_resource_group.backend.name
}

output "resource_group_id" {
  description = "Azure resource ID of the backend resource group."
  value       = azurerm_resource_group.backend.id
}

output "resource_group_location" {
  description = "Azure region containing the backend resource group."
  value       = azurerm_resource_group.backend.location
}