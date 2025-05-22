variable "resource_group_name" {
  description = "Resource group name for Azure resources."
  type        = string
}

variable "location" {
  description = "Azure region for resources."
  type        = string
}

variable "apim_name" {
  description = "Name of the existing Azure API Management instance."
  type        = string
}

variable "storage_account_name" {
  description = "Storage account name for the Terraform backend state."
  type        = string
}

variable "container_name" {
  description = "Container name for the Terraform backend state."
  type        = string
}

variable "terraform_state_key" {
  description = "Blob key for the Terraform backend state."
  type        = string
}
