import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log(`API Version: v1.0.0 | Endpoint: /Patient | Method: GET | Query: ${JSON.stringify(req.query)}`);
    context.res = {
        status: 200,
        headers: { "Content-Type": "application/fhir+json" },
        body: {
            resourceType: "Bundle",
            entry: []
        }
    };
};

export default httpTrigger;
