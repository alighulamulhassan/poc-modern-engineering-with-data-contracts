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
infra/               # Terraform for Azure APIM and mock policies
sample-apis/         # OpenAPI specs (FHIR)
README.md            # Project overview and instructions
```

## Infrastructure & CI/CD
- **Terraform** (`infra/`): Provisions Azure APIM and configures mock policies.
- **GitHub Actions** (`.github/workflows/`):
  - `deploy-apim-mock.yaml`: Imports OpenAPI specs and enables APIM mocking.

## Automated Dynamic Mocking with Prism and Terraform

This project automatically generates dynamic mock responses for each OpenAPI spec and injects them into Azure API Management (APIM) policies using Terraform. The process is fully automated via GitHub Actions and requires no manual steps after a PR is merged.

### How it Works

1. **OpenAPI Specs**: Place your OpenAPI 3.x YAML files in the `sample-apis/` directory.
2. **Mock Generation**: On every push to `main`, the GitHub Actions workflow runs `infra/generate-mocks.js`, which:
    - Uses [Prism](https://github.com/stoplightio/prism) to generate mock responses for each API operation.
    - Updates `infra/main.tf` to inject the generated mock payloads into the APIM mock policy.
3. **Terraform Apply**: The workflow then runs `terraform apply` to deploy the updated policies to Azure APIM.

### Local Development

To run the mock generation and update policies locally:

```sh
cd infra
npm install -g @stoplight/prism-cli
node generate-mocks.js
terraform init
terraform apply
```

### CI/CD Automation

The workflow is defined in `.github/workflows/deploy.yml` and will:
- Install dependencies
- Generate mocks and update Terraform
- Deploy to Azure APIM

### Adding a New API

1. Add your OpenAPI YAML file to `sample-apis/`.
2. Commit and push to `main` (or open a PR and merge).
3. The workflow will automatically generate the mock and update APIM.

---

For more details, see `infra/generate-mocks.js` and the workflow file.

## Future Work
- Evaluate and document the pros and cons of Azure APIM vs. Wiremock for different use cases.
- Automate the process of generating and deploying mocks from OpenAPI specs.

---

*This project is a proof of concept for modernizing API-driven development workflows using Azure APIM mocking*
