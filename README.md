# API-First Platform: Automated Mocking & TypeScript Data Contracts with Azure APIM

## Overview
This project enables true API-first development by automating the deployment of Azure API Management (APIM) APIs from OpenAPI specifications, generating dynamic mocks for all API operations, and producing TypeScript data contracts for frontend-backend consistency. By treating OpenAPI specs as the single source of truth, the platform ensures:
- Reliable, up-to-date mock services for rapid frontend development
- Type-safe npm packages for frontend teams, generated directly from API definitions
- Automated, reproducible infrastructure and contract updates via CI/CD

This approach accelerates parallel development, reduces integration risk, and eliminates data contract drift between teams.

## Pipeline Architecture

The platform uses a multi-stage CI/CD pipeline to automate all key steps:

1. **Infrastructure & API Deployment**
   - Uses Terraform to provision and update Azure APIM resources
   - Imports all OpenAPI specs from `sample-apis/` and creates/updates APIs and operations
   - Ensures APIM always reflects the latest API definitions

2. **Dynamic Mock Generation**
   - Runs a Node.js script (`infra/generate-mocks.js`) that uses Prism to generate dynamic mock responses for every operation in every OpenAPI spec
   - Automatically uploads and configures these mocks as APIM operation policies
   - Enables frontend teams to develop and test against realistic, up-to-date mocks

3. **TypeScript Data Contract Generation & Publishing**
   - Uses `swagger-typescript-api` to generate TypeScript types/interfaces from all OpenAPI specs (see `types-package/scripts/generate-types.ts`)
   - Publishes the generated types as an npm package (`types-package`) for frontend consumption
   - Ensures both frontend and backend always use the same, versioned data contracts

All of these steps are automated via GitHub Actions workflows:
- `.github/workflows/infra-apim-deploy.yaml`: Deploys infrastructure and APIs
- `.github/workflows/publish-types.yml`: Generates and publishes TypeScript types

## Benefits
- **Parallel Development:** Frontend and backend teams can work independently, reducing bottlenecks and accelerating delivery.
- **Early Feedback:** Frontend teams can provide feedback on API design and usability before backend implementation is complete.
- **Reduced Integration Risk:** Early and continuous integration with mock services helps identify issues sooner.
- **Single Source of Truth:** TypeScript types generated from OpenAPI specs ensure both frontend and backend use consistent data contracts.

## Getting Started
1. **API Design:** Define and agree on OpenAPI specifications for all endpoints in `sample-apis/`
2. **Mock Deployment:** Deploy mocks to Azure APIM through the automated pipeline
3. **Frontend Integration:** Point frontend applications to the mock endpoints for development and testing
4. **TypeScript Types:** Generate and publish TypeScript types for frontend consumption

## Directory Structure

```
infra/               # Infrastructure and mock generation code
  ├── main.tf       # Terraform configuration for APIM
  ├── generate-mocks.js  # Mock generation and policy updates
  └── templates/    # Policy templates
types-package/       # TypeScript types generation and npm package
  ├── scripts/generate-types.ts  # Script to generate types from OpenAPI
  ├── package.json  # npm package definition
  └── tsconfig.json # TypeScript config
sample-apis/        # OpenAPI specs
  ├── patient-api.yaml   # FHIR Patient API spec
  └── products-api.yaml  # Products API spec
```

## Local Development

To run the mock generation and types generation locally:

```sh
cd infra
npm install
npm install -g @stoplight/prism-cli
source ./set-env.sh  # Set required environment variables
node generate-mocks.js
```

To generate and publish TypeScript types:

```sh
cd types-package
npm install
npm run generate   # Runs scripts/generate-types.ts to generate types
npm run build      # Compiles TypeScript to dist/
npm publish        # Publishes the package for frontend consumption
```

## CI/CD Pipeline

- **infra-apim-deploy.yaml**: Deploys/updates APIs in APIM using Terraform and OpenAPI specs
- **publish-types.yml**: Generates and publishes TypeScript types to npm for frontend use

## Adding a New API

1. Add your OpenAPI YAML file to `sample-apis/`
2. Commit and push to `main` (or open a PR and merge)
3. The pipeline will:
   - Create/update the API in APIM
   - Generate dynamic mocks
   - Configure mock policies
   - Generate and publish updated TypeScript types

## Troubleshooting & Build Issues

If you run `npm run generate` in `types-package` and no types are generated in `src/`, check the following:
- Ensure your OpenAPI YAML files in `sample-apis/` are valid and contain schemas
- Ensure the `src/` directory exists (it will be created automatically if missing)
- Check for errors in the console output; fix any issues in the OpenAPI specs or script
- The script will generate one TypeScript file per API spec and an `index.ts` barrel export

## Future Work
- Support additional OpenAPI features and response types
- Add validation for mock responses against schemas
- Implement caching strategies for frequently accessed mocks
- Enhance type generation for more advanced OpenAPI constructs

---

*This project demonstrates modern API-first development practices using Azure APIM, automated mocking, and TypeScript data contract generation for frontend-backend consistency.*
