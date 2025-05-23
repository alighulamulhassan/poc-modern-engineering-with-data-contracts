#!/usr/bin/env node
// generate-mocks.js
// For each OpenAPI spec, generate mock responses for each operation and set them in APIM context variables

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const apisDir = path.join(__dirname, '../sample-apis');
const AZURE_APIM_RESOURCE_GROUP = process.env.AZURE_APIM_RESOURCE_GROUP;
const AZURE_APIM_SERVICE_NAME = process.env.AZURE_APIM_SERVICE_NAME;
const AZURE_SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;

// Add this at the top of the file after the imports
let currentPrismProcess = null;
let isPortInUse = false;
let prismServer = null;

function killPrismProcess() {
  if (currentPrismProcess) {
    try {
      currentPrismProcess.kill('SIGTERM');
      currentPrismProcess = null;
      isPortInUse = false;
    } catch (error) {
      console.error('Error killing Prism process:', error);
    }
  }
}

// Helper function to check if port is in use
function checkPortInUse(port) {
  try {
    execSync(`lsof -i:${port}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to wait for port to be free
async function waitForPortToBeFree(port, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    if (!checkPortInUse(port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

// Validate required environment variables and tools
function validateEnvironment() {
  const requiredVars = ['AZURE_APIM_RESOURCE_GROUP', 'AZURE_APIM_SERVICE_NAME', 'AZURE_SUBSCRIPTION_ID'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }

  // Validate Prism CLI installation
  try {
    execSync('prism --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('Prism CLI is not installed. Please run: npm install -g @stoplight/prism-cli');
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

async function startPrismServer(apiSpec) {
  // Kill any existing Prism process
  if (prismServer) {
    try {
      prismServer.kill('SIGTERM');
    } catch (error) {
      console.error('Error killing existing Prism process:', error);
    }
  }

  return new Promise((resolve, reject) => {
    console.log(`Starting Prism server for ${apiSpec}`);
    prismServer = spawn('prism', ['mock', '-d', apiSpec, '--errors']);
    let serverStarted = false;
    let errorOutput = '';

    prismServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Prism output: ${output}`);
      if (output.includes('Prism is listening') && !serverStarted) {
        serverStarted = true;
        // Add a small delay to ensure server is fully ready
        setTimeout(() => resolve(), 1000);
      }
    });

    prismServer.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Prism error: ${data}`);
    });

    prismServer.on('error', (error) => {
      reject(new Error(`Failed to start Prism: ${error.message}`));
    });

    // Set a timeout for server startup
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error(`Prism server startup timeout\n${errorOutput}`));
      }
    }, 10000);
  });
}

async function getMockResponse(method, pathTemplate) {
  try {
    const response = await new Promise((resolve, reject) => {
      const curlProcess = spawn('curl', [
        '-X',
        method.toUpperCase(),
        `http://localhost:4010${pathTemplate}`,
        '-H',
        'Accept: application/json',
        '-H',
        'Content-Type: application/json'
      ]);

      let responseData = '';
      let errorData = '';

      curlProcess.stdout.on('data', (data) => {
        responseData += data;
      });

      curlProcess.stderr.on('data', (data) => {
        errorData += data;
      });

      curlProcess.on('close', (code) => {
        if (code === 0 && responseData) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData); // Return raw response if not JSON
          }
        } else {
          reject(new Error(`Failed to get mock response: ${errorData}`));
        }
      });
    });

    return response;
  } catch (error) {
    throw new Error(`Failed to get mock response: ${error.message}`);
  }
}

async function setNamedValue(name, value, token) {
  const url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${AZURE_APIM_SERVICE_NAME}/namedValues/${name}?api-version=2021-08-01`;

  try {
    const body = {
      properties: {
        displayName: name,
        value: value,
        secret: false
      }
    };

    const escapedBody = JSON.stringify(body).replace(/'/g, "'\\''");

    const result = execSync(`curl -s -X PUT "${url}" \
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

async function patchApiPolicy(apiName, operationId, token) {
  const url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${AZURE_APIM_SERVICE_NAME}/apis/${apiName}/operations/${operationId}/policies/policy?api-version=2021-08-01`;

  try {
    const policyXml = fs.readFileSync(path.join(__dirname, 'templates/mock-policy.xml'), 'utf8')
      .replace('${api_name}', apiName)
      .replace('${operation_id}', operationId);

    const body = {
      properties: {
        format: 'xml',
        value: policyXml
      }
    };

    const escapedBody = JSON.stringify(body).replace(/'/g, "'\\''");

    const result = execSync(`curl -s -X PUT "${url}" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '${escapedBody}'`, {
      encoding: 'utf8'
    });

    console.log(`Successfully updated policy for operation ${operationId}`);
    return result;
  } catch (error) {
    console.error(`Error updating policy for operation ${operationId}:`, error);
    throw error;
  }
}

async function processOperation(apiName, pathTemplate, method, operation, token) {
  if (!operation.operationId) return;

  console.log(`Processing operation: ${method.toUpperCase()} ${pathTemplate} (${operation.operationId})`);
  try {
    // Get mock response from running Prism server
    const mockResponse = await getMockResponse(method, pathTemplate);
    console.log('Generated mock response:', JSON.stringify(mockResponse, null, 2));
    
    // Set named value for the mock response
    const namedValueKey = `${apiName}-${operation.operationId}-mock`;
    await setNamedValue(namedValueKey, JSON.stringify(mockResponse), token);
    
    // Update operation policy
    await patchApiPolicy(apiName, operation.operationId, token);
  } catch (error) {
    console.error(`Failed to process operation ${operation.operationId}:`, error);
  }
}

async function processApiSpec(apiSpecFile, token) {
  console.log(`Processing API spec: ${apiSpecFile}`);
  const apiSpec = path.join(apisDir, apiSpecFile);
  const spec = yaml.load(fs.readFileSync(apiSpec, 'utf8'));
  const apiName = apiSpecFile.replace('.yaml', '');

  try {
    // Start Prism server for this API spec
    await startPrismServer(apiSpec);

    // Flatten the operations into a single array
    const operations = [];
    for (const [pathTemplate, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (operation.operationId) {
          operations.push({ pathTemplate, method, operation });
        }
      }
    }

    // Process operations sequentially
    for (const op of operations) {
      await processOperation(apiName, op.pathTemplate, op.method, op.operation, token);
    }
  } finally {
    // Cleanup Prism server after processing all operations for this spec
    if (prismServer) {
      prismServer.kill('SIGTERM');
      prismServer = null;
    }
  }
}

async function main() {
  try {
    validateEnvironment();
    const token = await getAzureToken();

    // Check if Prism is installed
    try {
      execSync('prism --version');
    } catch (error) {
      console.error('Prism CLI is not installed. Installing...');
      execSync('npm install -g @stoplight/prism-cli');
    }

    // Process each API spec sequentially
    const apiSpecFiles = fs.readdirSync(apisDir).filter(file => file.endsWith('.yaml'));
    for (const apiSpecFile of apiSpecFiles) {
      await processApiSpec(apiSpecFile, token);
    }

    console.log('Successfully generated and uploaded all mock responses and policies');
  } catch (error) {
    console.error('Failed to generate mocks:', error);
    process.exit(1);
  } finally {
    // Ensure Prism server is cleaned up
    if (prismServer) {
      prismServer.kill('SIGTERM');
    }
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
