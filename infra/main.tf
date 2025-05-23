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

  # Remove prevent_destroy to allow updates
  lifecycle {
    # Prevent accidental changes to name and versioning scheme
    ignore_changes = [
      name,
      versioning_scheme
    ]
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
      path,
      subscription_required,
      service_url,
      import
    ]
  }

  timeouts {
    create = "30m"
    update = "30m"
    read = "5m"
    delete = "30m"
  }
}

# Extract operations from OpenAPI specs
locals {
  api_operations = flatten([
    for file_name, spec in local.api_specs : [
      for path, path_info in spec.paths : [
        for method, operation in path_info : {
          api_name = local.api_names[file_name]
          operation_id = operation.operationId
          display_name = operation.summary
          method = upper(method)
          url_template = path
          description = try(operation.description, operation.summary)
          request = try(operation.requestBody.content["application/json"].schema != null ? {
            representation_type = "application/json"
            schema = jsonencode(operation.requestBody.content["application/json"].schema)
          } : null, null)
          responses = try([
            for status, response in operation.responses : {
              status_code = tonumber(status)
              representation = try(response.content["application/json"] != null ? {
                content_type = "application/json"
                schema = jsonencode(response.content["application/json"].schema)
              } : null, null)
            } if tonumber(status) != null
          ], [])
          template_parameters = try([
            for param in operation.parameters : {
              name = param.name
              type = try(param.schema.type, "string")
              required = param.required
              description = try(param.description, null)
            } if param.in == "path"
          ], [])
        } if operation.operationId != null
      ]
    ]
  ])

  operation_policies = {
    for op in local.api_operations : 
    "${op.api_name}-${op.operation_id}" => op
  }
}

# Skip creating operations separately since they are created by the API import
# Instead, only apply policies to the operations

# Apply basic policies to individual operations
resource "azurerm_api_management_api_operation_policy" "basic_policies" {
  for_each = local.operation_policies

  api_name            = each.value.api_name
  api_management_name = var.apim_name
  resource_group_name = var.resource_group_name
  operation_id        = each.value.operation_id
  xml_content = file("${path.module}/templates/basic-policy.xml")

  depends_on = [
    azurerm_api_management_api.apis
  ]

  lifecycle {
    create_before_destroy = true
  }
}
