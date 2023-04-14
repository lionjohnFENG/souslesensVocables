const { processResponse } = require("./utils");
const SourceIntegrator = require("../../../bin/sourceIntegrator.");

module.exports = function () {
    let operations = {
        POST,
    };
    async function POST(req, res, next) {
        const body = req.body.body;
        SourceIntegrator.getOntologyRootUris(body.sourceUrl, body.options, function (err, result) {
            processResponse(res, err, result);
        });
    }

    POST.apiDoc = {
        summary: "Get the common parts of uris",
        security: [{ loginScheme: [] }],
        operationId: "getOntologyRootUris",
        parameters: [
            {
                name: "body",
                description: "body",
                in: "body",
                schema: {
                    type: "object",
                    properties: {
                        sourceUrl: {
                            type: "string",
                        },
                        options: {
                            type: "object",
                        },
                    },
                },
            },
        ],
        responses: {
            default: {
                description: "Response…",
            },
        },
    };

    return operations;
};
