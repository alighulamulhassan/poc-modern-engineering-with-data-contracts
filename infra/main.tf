# Terraform configuration for APIM API registration and mocking only

provider "azurerm" {
  features {}
}

terraform {
  backend "azurerm" {}
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
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
  version            = each.value.info.version
  
  import {
    content_format = "openapi"
    content_value  = file("${path.module}/../sample-apis/${each.key}")
  }
}

# Apply mock policies to all APIs
resource "azurerm_api_management_api_operation_policy" "mock_policies" {
  for_each = {
    for api in azurerm_api_management_api.apis : api.name => api
  }
  
  api_name            = each.value.name
  api_management_name = var.apim_name
  resource_group_name = var.resource_group_name
  # We'll get the operation_id from the generate-mocks.js script output
  operation_id        = "*"  # This will apply to all operations
  xml_content         = <<XML
<policies>
  <inbound>
    <base />
    <mock-response status-code="200" content-type="application/json">
      <body>@(context.Variables.GetValueOrDefault<string>("mock-response"))</body>
    </mock-response>
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>
XML

  depends_on = [azurerm_api_management_api.apis]
}
