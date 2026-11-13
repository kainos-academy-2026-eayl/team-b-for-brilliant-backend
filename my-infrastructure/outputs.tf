output "resource_group_name" {
  description = "Name of the backend Azure resource group."
  value       = module.resource_group.name
}

output "resource_group_id" {
  description = "Azure resource ID of the backend resource group."
  value       = module.resource_group.id
}

output "resource_group_location" {
  description = "Azure region containing the backend resource group."
  value       = module.resource_group.location
}