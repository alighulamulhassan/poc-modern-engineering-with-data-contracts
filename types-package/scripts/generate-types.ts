import { generateApi } from 'swagger-typescript-api';
import * as path from 'path';
import * as fs from 'fs';

const API_SPECS_DIR = path.resolve(__dirname, '../../sample-apis');
const OUTPUT_DIR = path.resolve(__dirname, '../src');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read all YAML files from the sample-apis directory
const apiFiles = fs.readdirSync(API_SPECS_DIR)
  .filter(file => file.endsWith('.yaml'));

// Generate types for each API spec
apiFiles.forEach(async (file) => {
  const apiName = path.basename(file, '.yaml');
  const inputPath = path.join(API_SPECS_DIR, file);
  const outputPath = path.join(OUTPUT_DIR, `${apiName}.ts`);

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