# API-First Development with Azure APIM Mocking

## Overview
This project demonstrates how to decouple the development lifecycle of the frontend from the backend by adopting an API design-first approach. The goal is to enable frontend teams to begin development in parallel with backend teams by providing reliable mock services early in the process.

## Pipeline Architecture

The project uses a two-job pipeline for deploying APIs and mocks:

### Job 1: Infrastructure Deployment
- Creates APIM resources using Terraform
- Imports OpenAPI specs into APIM
- Creates basic API operations
- Uses `main.tf` for core infrastructure

### Job 2: Dynamic Mock Generation
- Generates dynamic mocks using Prism CLI
- Updates APIM operation policies via Azure API
- Uses `generate-mocks.js` for mock generation and policy updates

### TypeScript Types Generation & Data Contracts
- Generates TypeScript types/interfaces from OpenAPI specs using scripts in `types-package/`
- Publishes the generated types as an npm package for frontend consumption
- Ensures frontend and backend share a single source of truth for API data contracts, reducing drift and integration errors

## Benefits
- **Parallel Development:** Frontend and backend teams can work independently, reducing bottlenecks and accelerating delivery.
- **Early Feedback:** Frontend teams can provide feedback on API design and usability before backend implementation is complete.
- **Reduced Integration Risk:** Early and continuous integration with mock services helps identify issues sooner.
- **Single Source of Truth:** TypeScript types generated from OpenAPI specs ensure both frontend and backend use consistent data contracts.

## Getting Started
1. **API Design:** Define and agree on OpenAPI specifications for all endpoints
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

## Infrastructure & CI/CD
- **Terraform** (`infra/main.tf`): Provisions Azure APIM and creates API operations
- **GitHub Actions** (`.github/workflows/`):
  - `deploy.yml`: Two-job pipeline that deploys APIs and configures mocks

## Automated Dynamic Mocking

This project automatically generates dynamic mock responses for each OpenAPI spec and updates Azure API Management (APIM) policies. The process is fully automated via GitHub Actions and requires no manual steps after a PR is merged.

### How it Works

1. **OpenAPI Specs**: Place your OpenAPI 3.x YAML files in the `sample-apis/` directory
2. **API Creation**: The first job in the pipeline:
   - Uses Terraform to create APIs in APIM
   - Imports OpenAPI specs
   - Sets up basic API operations
3. **Mock Generation**: The second job:
   - Uses Prism to generate dynamic mock responses
   - Creates named values in APIM for mock data
   - Updates operation policies to serve mock responses
4. **TypeScript Types Generation**:
   - Run the script in `types-package/scripts/generate-types.ts` to generate TypeScript types/interfaces from OpenAPI specs
   - The generated types are published as an npm package (`types-package`) for frontend teams to consume

### Local Development

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
npm run generate-types   # Runs scripts/generate-types.ts to generate types
npm publish              # Publishes the package for frontend consumption
```

### CI/CD Pipeline

The workflow is defined in `.github/workflows/deploy.yml` and consists of:

1. **apim-deploy job:**
   - Creates/updates APIs in APIM using Terraform
   - Imports latest OpenAPI specs
2. **apim-mock-patch job:**
   - Generates dynamic mocks using Prism
   - Updates operation policies via Azure API
3. **types-publish job:**
   - Generates TypeScript types from OpenAPI specs
   - Publishes the npm package for frontend consumption

### Adding a New API

1. Add your OpenAPI YAML file to `sample-apis/`
2. Commit and push to `main` (or open a PR and merge)
3. The pipeline will:
   - Create the API in APIM
   - Generate dynamic mocks
   - Configure mock policies
   - Generate and publish updated TypeScript types

## Future Work
- Support additional OpenAPI features and response types
- Add validation for mock responses against schemas
- Implement caching strategies for frequently accessed mocks
- Enhance type generation for more advanced OpenAPI constructs

---

*This project demonstrates modern API-first development practices using Azure APIM mocking and automated TypeScript data contract generation for frontend-backend consistency.*
