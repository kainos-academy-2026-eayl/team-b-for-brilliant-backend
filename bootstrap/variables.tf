variable "subscription_id" {
  description = "Azure subscription containing the Terraform state storage account."
  type        = string
}

variable "location" {
  description = "Azure region of the existing state resource group."
  type        = string
  default     = "uksouth"
}

variable "state_writer_principal_ids" {
  description = "Object IDs granted Storage Blob Data Contributor on the state account (e.g. CI service principal)."
  type        = list(string)
  default     = []
}
