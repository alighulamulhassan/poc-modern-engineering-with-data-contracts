# Terraform configuration for APIM API registration and mocking only

provider "azurerm" {
  features {}
  # Authentication will be provided via ARM_* environment variables
}

terraform {
  backend "azurerm" {}
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

# Load and parse all OpenAPI specs from sample-apis directory
locals {
  api_files = fileset(path.module, "../sample-apis/*.{yaml,yml}")
  api_specs = {
    for file in local.api_files : basename(file) => yamldecode(file(file))
  }
}

# Create or maintain version sets for APIs that have versions
resource "azurerm_api_management_api_version_set" "version_sets" {
  for_each = {
    for file, spec in local.api_specs : replace(lower(spec.info.title), " ", "-") => spec
    if spec.info.version != null
  }

  name                = "${each.key}-versions"
  resource_group_name = var.resource_group_name
  api_management_name = var.apim_name
  display_name        = "${each.value.info.title} Versions"
  versioning_scheme   = "Segment"

  lifecycle {
    prevent_destroy = true
  }
}

# Create APIs dynamically for each spec file
resource "azurerm_api_management_api" "apis" {
  for_each = local.api_specs

  name                = replace(lower(each.value.info.title), " ", "-")
  resource_group_name = var.resource_group_name
  api_management_name = var.apim_name
  revision            = "1"
  display_name        = each.value.info.title
  path                = replace(lower(each.value.info.title), " ", "-")
  protocols           = ["https"]
  
  # Only set version and version_set_id if version exists in the spec
  version            = each.value.info.version
  version_set_id     = each.value.info.version != null ? azurerm_api_management_api_version_set.version_sets[replace(lower(each.value.info.title), " ", "-")].id : null
  
  import {
    content_format = "openapi"
    content_value  = file("${path.module}/../sample-apis/${each.key}")
  }

  lifecycle {
    ignore_changes = [
      # Ignore changes to operations as policies are managed by generate-mocks.js
      path,
      soap_pass_through,
      subscription_required,
      service_url
    ]
  }
}

# Extract operations from OpenAPI specs
locals {
  api_operations = flatten([
    for file_name, spec in local.api_specs : [
      for path, path_info in spec.paths : [
        for method, operation in path_info : {
          api_name = replace(lower(spec.info.title), " ", "-")
          operation_id = operation.operationId
          display_name = operation.summary
          method = upper(method)
          url_template = path
          description = try(operation.description, operation.summary)
        } if operation.operationId != null
      ]
    ]
  ])

  operation_policies = {
    for op in local.api_operations : 
    "${op.api_name}-${op.operation_id}" => op
  }
}

# Create operations for each API
resource "azurerm_api_management_api_operation" "operations" {
  for_each = local.operation_policies

  operation_id        = each.value.operation_id
  api_name           = each.value.api_name
  api_management_name = var.apim_name
  resource_group_name = var.resource_group_name
  display_name       = each.value.display_name
  method            = each.value.method
  url_template      = each.value.url_template
  description       = each.value.description

  lifecycle {
    ignore_changes = [
      template_parameter,
      response
    ]
  }
}

# Apply basic policies to individual operations
resource "azurerm_api_management_api_operation_policy" "basic_policies" {
  for_each = local.operation_policies

  api_name            = each.value.api_name
  api_management_name = var.apim_name
  resource_group_name = var.resource_group_name
  operation_id        = each.value.operation_id
  xml_content = file("${path.module}/templates/basic-policy.xml")

  depends_on = [
    azurerm_api_management_api.apis,
    azurerm_api_management_api_operation.operations,
  ]
}
