
import { generateApi } from 'swagger-typescript-api';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';


// --- Auto-sync npm package version with the highest OpenAPI spec version ---
const packageJsonPath = path.resolve(__dirname, '../package.json');
const API_SPECS_DIR = path.resolve(__dirname, '../../sample-apis');
const apiFiles = fs.readdirSync(API_SPECS_DIR).filter(file => file.endsWith('.yaml'));

// Find the highest version among all OpenAPI specs
function parseVersion(v: string) {
  // Only supports semver, ignores pre-release/build for simplicity
  return v.split('.').map(Number);
}
let highestVersion = '0.0.1';
let foundVersion = false;
apiFiles.forEach(file => {
  const inputPath = path.join(API_SPECS_DIR, file);
  try {
    const doc = yaml.load(fs.readFileSync(inputPath, 'utf8')) as any;
    const version = doc?.info?.version;
    if (version) {
      foundVersion = true;
      if (
        parseVersion(version)[0] > parseVersion(highestVersion)[0] ||
        (parseVersion(version)[0] === parseVersion(highestVersion)[0] && parseVersion(version)[1] > parseVersion(highestVersion)[1]) ||
        (parseVersion(version)[0] === parseVersion(highestVersion)[0] && parseVersion(version)[1] === parseVersion(highestVersion)[1] && parseVersion(version)[2] > parseVersion(highestVersion)[2])
      ) {
        highestVersion = version;
      }
    }
  } catch (e) {
    console.warn(`Could not read version from ${file}:`, e);
  }
});

if (foundVersion) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.version !== highestVersion) {
      packageJson.version = highestVersion;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`Updated package.json version to match highest OpenAPI spec version: ${highestVersion}`);
    }
  } catch (e) {
    console.error('Error syncing package.json version with OpenAPI specs:', e);
  }
} else {
  console.warn('No OpenAPI spec versions found.');
}


const OUTPUT_DIR = path.resolve(__dirname, '../src');
// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate types for each API spec
apiFiles.forEach(async (file) => {
  const apiName = path.basename(file, '.yaml');
  const inputPath = path.join(API_SPECS_DIR, file);

  try {
    await generateApi({
      name: `${apiName}.ts`,
      output: OUTPUT_DIR,
      input: inputPath,
      generateClient: false,
      generateRouteTypes: true,
      generateResponses: true,
      toJS: false,
      extractRequestParams: true,
      extractRequestBody: true,
      prettier: {
        printWidth: 120,
        tabWidth: 2,
        trailingComma: 'all',
        parser: 'typescript',
      },
    });

    console.log(`Successfully generated types for ${apiName}`);
  } catch (error) {
    console.error(`Error generating types for ${apiName}:`, error);
  }
});

// Create index.ts to export all generated types
const indexContent = apiFiles
  .map(file => `export * from './${path.basename(file, '.yaml')}';`)
  .join('\n');

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
console.log('Generated index.ts with all type exports');

// --- Generate dist/index.d.ts as a barrel file for consumers ---
const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
const indexBarrelPath = path.join(distDir, 'index.d.ts');
fs.writeFileSync(indexBarrelPath, "export * from './src';\n");
console.log('Generated dist/index.d.ts barrel file for type consumers');