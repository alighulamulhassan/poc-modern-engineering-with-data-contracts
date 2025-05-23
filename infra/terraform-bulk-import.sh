#!/bin/bash

# CONFIGURATION
subscription_id="941e9d5e-8b22-4f2f-8a42-3b91925bab74"
resource_group="test-resource-group"
apim_name="api-management-service-resource-1"

# Login and set subscription (if needed)
az account set --subscription "$subscription_id"

# Get list of APIs
api_ids=$(az apim api list \
  --resource-group "$resource_group" \
  --service-name "$apim_name" \
  --query "[].name" -o tsv)

for api_name in $api_ids; do
  # Get operations for each API
  op_ids=$(az apim api operation list \
    --resource-group "$resource_group" \
    --service-name "$apim_name" \
    --api-id "$api_name" \
    --query "[].name" -o tsv)

  for op_id in $op_ids; do
    tf_key="${api_name}-${op_id}"
    resource_id="/subscriptions/${subscription_id}/resourceGroups/${resource_group}/providers/Microsoft.ApiManagement/service/${apim_name}/apis/${api_name}/operations/${op_id}"

    echo "Importing: $tf_key"
    terraform import "azurerm_api_management_api_operation.operations[\"$tf_key\"]" "$resource_id"
  done
done
