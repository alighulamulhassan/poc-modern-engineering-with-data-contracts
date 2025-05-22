import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const patientId = context.bindingData.id;
    context.log(`API Version: v1.0.0 | Endpoint: /Patient/${patientId} | Method: GET | Args: ${patientId}`);
    context.res = {
        status: 200,
        headers: { "Content-Type": "application/fhir+json" },
        body: {
            resourceType: "Patient",
            id: patientId,
            name: [{ family: "Smith", given: ["John"] }],
            gender: "male",
            birthDate: "1980-01-01"
        }
    };
};

export default httpTrigger;
