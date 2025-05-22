#!/usr/bin/env node
// generate-mocks.js
// For each OpenAPI spec, for each operation, generate a mock response with Prism and PATCH the APIM operation policy.

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const apisDir = path.join(__dirname, '../sample-apis');
const AZURE_TOKEN = getAzureToken();
const AZURE_APIM_RESOURCE_GROUP = process.env.AZURE_APIM_RESOURCE_GROUP;
const AZURE_APIM_SERVICE_NAME = process.env.AZURE_APIM_SERVICE_NAME;
const AZURE_SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;

function getAzureToken() {
  return execSync('az account get-access-token --query accessToken -o tsv').toString().trim();
}

function startPrism(apiPath) {
  return spawn('npx', ['-y', '@stoplight/prism-cli', 'mock', apiPath, '--port', '4010'], {
    stdio: 'ignore',
    detached: true,
  });
}

function stopPrism(prismProc) {
  try { process.kill(-prismProc.pid); } catch {}
}

function fetchMockResponse(endpoint, method = 'get') {
  const curlCmd = `curl -s -X ${method.toUpperCase()} http://localhost:4010${endpoint}`;
  try {
    return execSync(curlCmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return null;
  }
}

function getAllOperationsFromSpec(spec) {
  if (!spec.paths) return [];
  return Object.entries(spec.paths).flatMap(([endpoint, ops]) =>
    Object.entries(ops)
      .filter(([_, opObj]) => opObj && opObj.operationId)
      .map(([method, opObj]) => ({ endpoint, method, operationId: opObj.operationId }))
  );
}

function buildPolicyXml(mock) {
  return `<policies><inbound><base /><mock-response status-code='200' content-type='application/json'><body>${mock.replace(/'/g, "&apos;")}</body></mock-response></inbound><backend><base /></backend><outbound><base /></outbound><on-error><base /></on-error></policies>`;
}

function patchOperationPolicy(apiName, operationId, policyXml) {
  const url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${AZURE_APIM_SERVICE_NAME}/apis/${apiName}/operations/${operationId}/policy?api-version=2024-05-01`;
  const payload = JSON.stringify({ properties: { format: 'rawxml', value: policyXml } });
  execSync(`curl -X PUT -H "Authorization: Bearer ${AZURE_TOKEN}" -H "Content-Type: application/json" --data '${payload}' "${url}"`, { stdio: 'inherit' });
}

async function patchMocksForApi(apiFile) {
  const apiName = path.basename(apiFile, path.extname(apiFile));
  const apiPath = path.join(apisDir, apiFile);
  const spec = yaml.load(fs.readFileSync(apiPath, 'utf8'));
  const operations = getAllOperationsFromSpec(spec);
  for (const { endpoint, method, operationId } of operations) {
    const prism = startPrism(apiPath);
    await new Promise(res => setTimeout(res, 2000));
    const mock = fetchMockResponse(endpoint, method);
    stopPrism(prism);
    if (!mock) continue;
    const policyXml = buildPolicyXml(mock);
    patchOperationPolicy(apiName, operationId, policyXml);
  }
}

async function main() {
  const files = fs.readdirSync(apisDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  for (const file of files) {
    await patchMocksForApi(file);
  }
}

main();
