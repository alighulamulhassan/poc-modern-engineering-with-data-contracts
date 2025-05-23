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

  # Standardize API name derivation
  api_names = {
    for file, spec in local.api_specs : file => replace(replace(lower(basename(file)), ".yaml", ""), ".yml", "")
  }
}

# Create or maintain version sets for APIs that have versions
resource "azurerm_api_management_api_version_set" "version_sets" {
  for_each = {
    for file, spec in local.api_specs : local.api_names[file] => spec
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

  name                = local.api_names[each.key]
  resource_group_name = var.resource_group_name
  api_management_name = var.apim_name
  revision            = "1"
  display_name        = each.value.info.title
  path                = local.api_names[each.key]
  protocols           = ["https"]
  
  # Only set version and version_set_id if version exists in the spec
  version            = each.value.info.version
  version_set_id     = each.value.info.version != null ? azurerm_api_management_api_version_set.version_sets[local.api_names[each.key]].id : null
  
  import {
    content_format = "openapi"
    content_value  = file("${path.module}/../sample-apis/${each.key}")
  }

  lifecycle {
    ignore_changes = [
      # Ignore changes to operations as policies are managed by generate-mocks.js
      path,
      subscription_required,
      service_url
    ]
  }
}

# Extract operations from OpenAPI specs
locals {
  # This block processes OpenAPI specifications to extract API operation details
  # It flattens nested data from the specs into a list of operation objects
  api_operations = flatten([
    # Iterate through each API specification file
    for file_name, spec in local.api_specs : [
      # For each path in the spec
      for path, path_info in spec.paths : [
        # For each HTTP method (GET, POST etc) in the path
        for method, operation in path_info : {
          # Generate API name from title, converting to lowercase with hyphens
          api_name = local.api_names[file_name]
          # Extract operation ID which uniquely identifies the operation
          operation_id = operation.operationId
          # Get operation summary for display name
          display_name = operation.summary
          # Convert HTTP method to uppercase
          method = upper(method)
          # Get the URL path template
          url_template = path
          # Get description, falling back to summary if not present
          description = try(operation.description, operation.summary)
          # Extract request schema if present
          request = try(operation.requestBody.content["application/json"].schema != null ? {
            representation_type = "application/json"
            schema = jsonencode(operation.requestBody.content["application/json"].schema)
          } : null, null)
          # Extract response details for each status code
          responses = try([
            for status, response in operation.responses : {
              # Convert status code string to number
              status_code = tonumber(status)
              # Get response schema and example if present
              representation = try(response.content["application/json"] != null ? {
                content_type = "application/json"
                schema = jsonencode(response.content["application/json"].schema)
                example = try(response.content["application/json"].example, null)
              } : null, null)
            }
          ], [])
        } if operation.operationId != null # Only include operations with an ID
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

  dynamic "request" {
    for_each = each.value.request != null ? [each.value.request] : []
    content {
      representation {
        content_type = request.value.representation_type
        schema_id = "default"
        type_name = "default"
      }
    }
  }

  dynamic "response" {
    for_each = each.value.responses
    content {
      status_code = response.value.status_code
      dynamic "representation" {
        for_each = response.value.representation != null ? [response.value.representation] : []
        content {
          content_type = representation.value.content_type
          schema_id = "default"
          type_name = "default"
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template_parameter
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
