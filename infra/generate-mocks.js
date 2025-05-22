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

// Validate required environment variables
function validateEnvironment() {
  const requiredVars = ['AZURE_APIM_RESOURCE_GROUP', 'AZURE_APIM_SERVICE_NAME', 'AZURE_SUBSCRIPTION_ID'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }
}

async function getAzureToken() {
  try {
    return execSync('az account get-access-token --query accessToken -o tsv').toString().trim();
  } catch (error) {
    console.error('Failed to get Azure token:', error.message);
    process.exit(1);
  }
}

async function generateMockResponse(apiSpec, path, method, operationId) {
  try {
    // Get the operation from the spec
    const specContent = fs.readFileSync(apiSpec, 'utf8');
    let spec;
    try {
      spec = yaml.load(specContent);
    } catch (yamlError) {
      throw new Error(`Failed to parse YAML from ${apiSpec}: ${yamlError.message}`);
    }

    const operation = spec.paths[path]?.[method.toLowerCase()];
    if (!operation) {
      throw new Error(`Operation not found: ${method} ${path}`);
    }
    
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

async function main() {
  try {
    validateEnvironment();
    
    const token = await getAzureToken();
    const files = fs.readdirSync(apisDir).filter(file => file.endsWith('.yaml'));

    for (const file of files) {
      const apiSpec = path.join(apisDir, file);
      console.log(`Processing API spec: ${file}`);

      const spec = yaml.load(fs.readFileSync(apiSpec, 'utf8'));
      
      for (const [path, pathObj] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(pathObj)) {
          const operationId = operation.operationId;
          if (!operationId) {
            console.warn(`Warning: Missing operationId for ${method} ${path}`);
            continue;
          }

          try {
            const mockResponse = await generateMockResponse(apiSpec, path, method, operationId);
            const mockResponseStr = JSON.stringify(mockResponse);
            const namedValueKey = `mock-${operationId}`;
            
            await setNamedValue(namedValueKey, mockResponseStr, token);
          } catch (error) {
            console.error(`Failed to process operation ${operationId}:`, error);
            // Continue with other operations even if one fails
          }
        }
      }
    }

    console.log('Successfully generated and uploaded all mock responses');
  } catch (error) {
    console.error('Failed to generate mocks:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
