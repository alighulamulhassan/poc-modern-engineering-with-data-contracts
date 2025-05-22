#!/usr/bin/env node
// generate-mocks.js
// For each OpenAPI spec, generate mock responses for each operation and set them in APIM context variables

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');
const { promisify } = require('util');

const apisDir = path.join(__dirname, '../sample-apis');
const AZURE_APIM_RESOURCE_GROUP = process.env.AZURE_APIM_RESOURCE_GROUP;
const AZURE_APIM_SERVICE_NAME = process.env.AZURE_APIM_SERVICE_NAME;
const AZURE_SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;

async function getAzureToken() {
  return execSync('az account get-access-token --query accessToken -o tsv').toString().trim();
}

async function generateMockResponse(apiSpec, path, method, operationId) {
  try {
    // Get the operation from the spec
    const spec = yaml.load(fs.readFileSync(apiSpec, 'utf8'));
    const operation = spec.paths[path][method.toLowerCase()];
    
    // For listPatients, return a bundle with multiple patients
    if (operationId === 'listPatients') {
      return {
        resourceType: "Bundle",
        type: "searchset",
        total: 2,
        entry: [
          {
            resource: {
              resourceType: "Patient",
              id: "12345",
              name: [{ family: "Smith", given: ["John"] }],
              gender: "male",
              birthDate: "1980-01-02"
            }
          },
          {
            resource: {
              resourceType: "Patient",
              id: "67890",
              name: [{ family: "Johnson", given: ["Sarah"] }],
              gender: "female",
              birthDate: "1992-03-15"
            }
          }
        ]
      };
    }
    
    // For getPatientById, return a single patient
    if (operationId === 'getPatientById') {
      return {
        resourceType: "Patient",
        id: "12345",
        name: [{ family: "Smith", given: ["John"] }],
        gender: "male",
        birthDate: "1980-01-02"
      };
    }

    throw new Error(`Unknown operation: ${operationId}`);
  } catch (error) {
    console.error(`Error generating mock for ${method} ${path}:`, error);
    throw error;
  }
}

async function setNamedValue(name, value, token) {
  const url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${AZURE_APIM_SERVICE_NAME}/namedValues/${name}?api-version=2021-08-01`;

  try {
    const body = {
      properties: {
        displayName: name,
        value: value, // Value is already stringified by the caller
        secret: false
      }
    };

    // Escape single quotes in the JSON
    const escapedBody = JSON.stringify(body).replace(/'/g, "'\\''");

    const result = execSync(`curl -X PUT "${url}" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '${escapedBody}'`, {
      encoding: 'utf8'
    });

    console.log(`Successfully set named value ${name}`);
    return result;
  } catch (error) {
    console.error(`Error setting named value ${name}:`, error);
    throw error;
  }
}

async function processSpecs() {
  try {
    const token = await getAzureToken();
    const files = fs.readdirSync(apisDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of files) {
      const apiPath = path.join(apisDir, file);
      const spec = yaml.load(fs.readFileSync(apiPath, 'utf8'));
      const apiName = spec.info.title.toLowerCase().replace(/ /g, '-');

      console.log(`Processing API: ${apiName}`);

      for (const [path, pathObj] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(pathObj)) {
          if (operation.operationId) {
            console.log(`Generating mock for ${method.toUpperCase()} ${path}`);
            
            const mockResponse = await generateMockResponse(apiPath, path, method, operation.operationId);
            const variableName = `${apiName}-${operation.operationId}-mock`;
            
            await setNamedValue(variableName, JSON.stringify(mockResponse), token);
            console.log(`Set mock response for ${variableName}`);
          }
        }
      }
    }

    console.log('All mock responses generated and stored in APIM');
  } catch (error) {
    console.error('Error processing specs:', error);
    process.exit(1);
  }
}

processSpecs();
