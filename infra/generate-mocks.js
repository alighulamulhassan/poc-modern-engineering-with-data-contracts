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

// Use Prism to generate dynamic mock responses
async function generateMockWithPrism(apiSpec, method, pathTemplate) {
  return new Promise((resolve, reject) => {
    console.log(`Generating mock for ${method.toUpperCase()} ${pathTemplate}`);
    
    // Start Prism server with dynamic response generation
    const prismProcess = spawn('prism', ['mock', '-d', apiSpec, '--errors']);
    let serverStarted = false;
    let errorOutput = '';

    prismProcess.stdout.on('data', async (data) => {
      const output = data.toString();
      console.log(`Prism output: ${output}`);
      if (output.includes('Server is listening') && !serverStarted) {
        serverStarted = true;
        try {
          // Add a small delay to ensure server is ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Make request to Prism server with appropriate headers
          const response = execSync(
            `curl -X ${method.toUpperCase()} http://localhost:4010${pathTemplate} \
            -H "Accept: application/json" \
            -H "Content-Type: application/json"`,
            { encoding: 'utf8' }
          );
          
          // Kill Prism server
          prismProcess.kill();
          
          try {
            resolve(JSON.parse(response));
          } catch (parseError) {
            resolve(response); // Return raw response if not JSON
          }
        } catch (error) {
          prismProcess.kill();
          reject(new Error(`Failed to get mock response: ${error.message}\n${errorOutput}`));
        }
      }
    });

    prismProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Prism error: ${data}`);
    });

    // Handle server startup timeout
    setTimeout(() => {
      if (!serverStarted) {
        prismProcess.kill();
        reject(new Error(`Prism server startup timeout\n${errorOutput}`));
      }
    }, 10000); // Increased timeout to 10 seconds

    prismProcess.on('error', (error) => {
      reject(new Error(`Failed to start Prism: ${error.message}`));
    });

    prismProcess.on('exit', (code, signal) => {
      if (code !== null && code !== 0 && !serverStarted) {
        reject(new Error(`Prism exited with code ${code}\n${errorOutput}`));
      }
    });
  });
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

    // Process each API spec
    const apiSpecFiles = fs.readdirSync(apisDir).filter(file => file.endsWith('.yaml'));
    
    for (const apiSpecFile of apiSpecFiles) {
      console.log(`Processing API spec: ${apiSpecFile}`);
      const apiSpec = path.join(apisDir, apiSpecFile);
      const spec = yaml.load(fs.readFileSync(apiSpec, 'utf8'));
      const apiName = apiSpecFile.replace('.yaml', '');

      for (const [pathTemplate, methods] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          if (!operation.operationId) continue;

          console.log(`Generating mock for ${method.toUpperCase()} ${pathTemplate} (${operation.operationId})`);
          try {
            // Generate mock response using Prism
            const mockResponse = await generateMockWithPrism(apiSpec, method, pathTemplate);
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
      }
    }

    console.log('Successfully generated and uploaded all mock responses and policies');
  } catch (error) {
    console.error('Failed to generate mocks:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
