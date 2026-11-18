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

output "frontend_resource_group_name" {
  description = "Name of the shared resource group used by the frontend."
  value       = module.resource_group.name
}

output "frontend_resource_group_id" {
  description = "Azure resource ID of the shared resource group used by the frontend."
  value       = module.resource_group.id
}

output "frontend_resource_group_location" {
  description = "Azure region of the shared resource group used by the frontend."
  value       = module.resource_group.location
}