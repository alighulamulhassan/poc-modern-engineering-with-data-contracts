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


