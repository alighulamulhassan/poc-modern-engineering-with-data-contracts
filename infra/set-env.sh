#!/bin/zsh

# Login to Azure (if not already logged in)
az account show &> /dev/null || az login

# Set ARM environment variables from current Azure CLI session
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
export ARM_TENANT_ID=$(az account show --query tenantId -o tsv)

# Get current user's service principal credentials
export ARM_CLIENT_ID=$(az account show --query user.name -o tsv)
export ARM_USE_OIDC=true

# Set AZURE environment variables for the script
export AZURE_SUBSCRIPTION_ID=$ARM_SUBSCRIPTION_ID

# Get APIM details
export AZURE_APIM_RESOURCE_GROUP="test-resource-group"
export AZURE_APIM_SERVICE_NAME=$(az apim list -g $AZURE_APIM_RESOURCE_GROUP --query '[0].name' -o tsv)

# Get storage account details for Terraform backend
export AZURE_STORAGE_ACCOUNT_NAME=$(az storage account list -g $AZURE_APIM_RESOURCE_GROUP --query '[0].name' -o tsv)
export AZURE_STORAGE_CONTAINER_NAME="pocmhraapimmockcontainer"

# Export Terraform variables
export TF_VAR_subscription_id=$ARM_SUBSCRIPTION_ID
export TF_VAR_tenant_id=$ARM_TENANT_ID
export TF_VAR_client_id=$ARM_CLIENT_ID
export TF_VAR_client_secret=$ARM_CLIENT_SECRET  # Note: This might be empty for OIDC auth
export TF_VAR_resource_group_name=$AZURE_APIM_RESOURCE_GROUP
export TF_VAR_apim_name=$AZURE_APIM_SERVICE_NAME
export TF_VAR_location=$(az group show -n $AZURE_APIM_RESOURCE_GROUP --query location -o tsv)

# Print the exported variables
echo "Environment variables set:"
echo "ARM_SUBSCRIPTION_ID: $ARM_SUBSCRIPTION_ID"
echo "ARM_TENANT_ID: $ARM_TENANT_ID"
echo "ARM_CLIENT_ID: $ARM_CLIENT_ID"
echo "AZURE_APIM_RESOURCE_GROUP: $AZURE_APIM_RESOURCE_GROUP"
echo "AZURE_APIM_SERVICE_NAME: $AZURE_APIM_SERVICE_NAME"
echo "AZURE_STORAGE_ACCOUNT_NAME: $AZURE_STORAGE_ACCOUNT_NAME"
echo "AZURE_STORAGE_CONTAINER_NAME: $AZURE_STORAGE_CONTAINER_NAME"
