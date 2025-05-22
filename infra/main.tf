# Terraform configuration for APIM API registration and mocking only

provider "azurerm" {
  features {}
}

terraform {
  backend "azurerm" {}
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
