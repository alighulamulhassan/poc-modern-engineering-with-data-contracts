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

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "tenant_id" {
  description = "Azure tenant ID"
  type        = string
}

variable "client_id" {
  description = "Azure client ID"
  type        = string
}

variable "client_secret" {
  description = "Azure client secret"
  type        = string
  sensitive   = true
}
