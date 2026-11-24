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

output "key_vault_name" {
  description = "Name of the backend Key Vault."
  value       = azurerm_key_vault.backend.name
}

output "key_vault_id" {
  description = "Azure resource ID of the backend Key Vault."
  value       = azurerm_key_vault.backend.id
}

output "key_vault_uri" {
  description = "Vault URI used to reference secrets from the Container App."
  value       = azurerm_key_vault.backend.vault_uri
}
