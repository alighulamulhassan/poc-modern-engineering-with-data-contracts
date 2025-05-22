# Terraform configuration for Azure Function App and APIM API registration

provider "azurerm" {
  features {}
}

variable "resource_group_name" {}
variable "location" {}
variable "apim_name" {}

resource "azurerm_storage_account" "function" {
  name                     = "mhrafuncstorage${random_id.suffix.hex}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "azurerm_app_service_plan" "function" {
  name                = "mhra-function-plan"
  location            = var.location
  resource_group_name = var.resource_group_name
  kind                = "FunctionApp"
  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}

resource "azurerm_function_app" "mhra" {
  name                       = "mhra-function-app-${random_id.suffix.hex}"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = azurerm_app_service_plan.function.id
  storage_account_name       = azurerm_storage_account.function.name
  storage_account_access_key = azurerm_storage_account.function.primary_access_key
  version                    = "~4"
  os_type                    = "linux"
  site_config {
    application_stack {
      node_version = "18-lts"
    }
  }
  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_api_management_api" "mhra_patient" {
  name                = "mhra-patient-api"
  resource_group_name = var.resource_group_name
  api_management_name = var.apim_name
  revision            = "1"
  display_name        = "MHRA Patient API"
  path                = "patient"
  protocols           = ["https"]
  import {
    content_format = "openapi"
    content_value  = file("${path.module}/../sample-apis/patient-api.yaml")
  }
  service_url = azurerm_function_app.mhra.default_hostname
}

resource "azurerm_api_management_api_operation_policy" "mock_policy" {
  api_name            = azurerm_api_management_api.mhra_patient.name
  operation_id        = "listPatients"
  api_management_name = var.apim_name
  resource_group_name = var.resource_group_name
  xml_content         = <<XML
<policies>
  <inbound>
    <base />
    <mock-response status-code="200" content-type="application/fhir+json">
      <body>{"resourceType": "Bundle", "entry": []}</body>
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
}
