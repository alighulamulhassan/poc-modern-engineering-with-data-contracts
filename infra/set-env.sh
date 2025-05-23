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

# Set resource group name - use environment variable if set, otherwise default or prompt
if [ -n "$TF_VAR_resource_group_name" ]; then
    export AZURE_APIM_RESOURCE_GROUP=$TF_VAR_resource_group_name
elif [ -z "$AZURE_APIM_RESOURCE_GROUP" ]; then
    echo "Enter resource group name (default: test-resource-group):"
    read input_rg
    export AZURE_APIM_RESOURCE_GROUP=${input_rg:-"test-resource-group"}
fi

# Set APIM name - use environment variable if set, otherwise get from Azure or prompt
if [ -n "$TF_VAR_apim_name" ]; then
    export AZURE_APIM_SERVICE_NAME=$TF_VAR_apim_name
elif [ -z "$AZURE_APIM_SERVICE_NAME" ]; then
    AZURE_APIM_SERVICE_NAME=$(az apim list -g $AZURE_APIM_RESOURCE_GROUP --query '[0].name' -o tsv)
    if [ -z "$AZURE_APIM_SERVICE_NAME" ]; then
        echo "No APIM instance found in resource group $AZURE_APIM_RESOURCE_GROUP"
        echo "Enter APIM service name:"
        read input_apim
        export AZURE_APIM_SERVICE_NAME=$input_apim
    fi
fi

# Get storage account details for Terraform backend
export AZURE_STORAGE_ACCOUNT_NAME=$(az storage account list -g $AZURE_APIM_RESOURCE_GROUP --query '[0].name' -o tsv)
export AZURE_STORAGE_CONTAINER_NAME="pocmhraapimmockcontainer"

# Set location - use environment variable if set, otherwise get from resource group
if [ -n "$TF_VAR_location" ]; then
    export AZURE_LOCATION=$TF_VAR_location
else
    export AZURE_LOCATION=$(az group show -n $AZURE_APIM_RESOURCE_GROUP --query location -o tsv)
fi

# Export Terraform variables
export TF_VAR_resource_group_name=$AZURE_APIM_RESOURCE_GROUP
export TF_VAR_apim_name=$AZURE_APIM_SERVICE_NAME
export TF_VAR_location=$AZURE_LOCATION

# Print the exported variables
echo "Environment variables set:"
echo "Resource Group Name: $TF_VAR_resource_group_name"
echo "APIM Name: $TF_VAR_apim_name"
echo "Location: $TF_VAR_location"
echo "ARM_SUBSCRIPTION_ID: $ARM_SUBSCRIPTION_ID"
echo "ARM_TENANT_ID: $ARM_TENANT_ID"
echo "ARM_CLIENT_ID: $ARM_CLIENT_ID"
echo "AZURE_APIM_RESOURCE_GROUP: $AZURE_APIM_RESOURCE_GROUP"
echo "AZURE_APIM_SERVICE_NAME: $AZURE_APIM_SERVICE_NAME"
echo "AZURE_STORAGE_ACCOUNT_NAME: $AZURE_STORAGE_ACCOUNT_NAME"
echo "AZURE_STORAGE_CONTAINER_NAME: $AZURE_STORAGE_CONTAINER_NAME"
