# Adapting Modern Engineering Practices

## Overview
This project demonstrates how to decouple the development lifecycle of the frontend from the backend by adopting an API design-first approach. The goal is to enable frontend teams to begin development in parallel with backend teams by providing reliable mock services early in the process.

## Approach
- **API Design First:** We prioritize designing and agreeing on API contracts before implementation begins. This ensures both frontend and backend teams have a clear, shared understanding of the interfaces.
- **Mock Services:**
  - **Azure API Management (APIM) Mocking:** We leverage Azure APIM's built-in mocking capabilities to provide cloud-based mock APIs. Frontend developers can connect to these mocks from their local environments, enabling early integration and testing.
  - **Wiremock (Feasibility Study):** We are also evaluating the use of Wiremock for local mock service deployment. Wiremock can generate mocks directly from OpenAPI specifications, providing flexibility for local development and testing.

## Benefits
- **Parallel Development:** Frontend and backend teams can work independently, reducing bottlenecks and accelerating delivery.
- **Early Feedback:** Frontend teams can provide feedback on API design and usability before backend implementation is complete.
- **Reduced Integration Risk:** Early and continuous integration with mock services helps identify issues sooner.

## Getting Started
1. **API Design:** Define and agree on OpenAPI specifications for all endpoints.
2. **Mock Deployment:**
   - Use Azure APIM to deploy and manage cloud-based mocks.
   - (Optional) Use Wiremock locally by generating stubs from OpenAPI specs.
3. **Frontend Integration:** Point frontend applications to the mock endpoints for development and testing.

## Directory Structure

```
function/
  Patient/           # /Patient endpoint (TypeScript Azure Function)
    index.ts
    function.json
  PatientById/       # /Patient/{id} endpoint (TypeScript Azure Function)
    index.ts
    function.json
  host.json
  local.settings.json
  package.json
  tsconfig.json
  requirements.txt   # (legacy, not used in Node.js)
  .gitignore
infra/               # Terraform for Azure infra and APIM
sample-apis/         # OpenAPI specs (FHIR)
```

## Azure Function Implementation

Sample Azure Functions are provided for the `/Patient` and `/Patient/{id}` endpoints. These log the input/args and return a FHIR-compliant response with the API version in the logs.

- `function/Patient/`: Handles GET `/Patient` (returns a FHIR Bundle)
- `function/PatientById/`: Handles GET `/Patient/{id}` (returns a FHIR Patient resource)

## Running Locally (Node.js/TypeScript)

1. Install dependencies:
   ```sh
   cd function
   npm install
   ```
2. Build TypeScript:
   ```sh
   npm run build
   ```
3. Start Azure Functions locally:
   ```sh
   npm start
   ```

## Infrastructure & CI/CD
- **Terraform** (`infra/`): Provisions Azure Function infra, registers APIs in APIM, and links them.
- **GitHub Actions** (`.github/workflows/`):
  - `deploy-function-apim.yaml`: Deploys function code and runs Terraform.
  - `deploy-apim-mock.yaml`: (Optional) Imports OpenAPI specs and enables APIM mocking.

## Future Work
- Evaluate and document the pros and cons of Azure APIM vs. Wiremock for different use cases.
- Automate the process of generating and deploying mocks from OpenAPI specs.

---

*This project is a proof of concept for modernizing API-driven development workflows using Azure APIM and Wiremock.*
