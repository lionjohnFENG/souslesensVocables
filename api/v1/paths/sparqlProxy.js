const { processResponse } = require("./utils");
const httpProxy = require("../../../bin/httpProxy.");
const GraphTraversal = require("../../../bin/graphTraversal.");
const ExportGraph = require("../../../bin/exportGraph.");
const SourceIntegrator = require("../../../bin/sourceIntegrator.");
const ConfigManager = require("../../../bin/configManager.");
const UserRequestFiltering = require("../../../bin/userRequestFiltering.");

module.exports = function () {
    let operations = {
        POST,
        GET,
    };

    async function POST(req, res, next) {
        try {
            if (req.body.POST) {
                var body = JSON.parse(req.body.body);

                if (ConfigManager.config && req.body.url.indexOf(ConfigManager.config.default_sparql_url) == 0) {
                    body.params.auth = {
                        user: ConfigManager.config.sparql_server.user,
                        pass: ConfigManager.config.sparql_server.password,
                        sendImmediately: false,
                    };
                    if (true) {
                        ConfigManager.getUserSources(req, res, function (err, userSources) {
                            if (err) {
                                return processResponse(res, err, userSources);
                            }

                            UserRequestFiltering.filterSparqlRequest(body.params.query, userSources, function (parsingError, filteredQuery) {
                                if (parsingError) {
                                    return processResponse(res, parsingError, null);
                                }
                                body.params.query = filteredQuery;

                                httpProxy.post(req.body.url, body.headers, body.params, function (err, result) {
                                    processResponse(res, err, result);
                                });
                            });
                        });
                    } else {
                        httpProxy.post(req.body.url, body.headers, body.params, function (err, result) {
                            processResponse(res, err, result);
                        });
                    }
                } else {
                    httpProxy.post(req.body.url, body.headers, body.params, function (err, result) {
                        processResponse(res, err, result);
                    });
                }
            } else {
                var options = {};
                if (req.body.options) {
                    if (typeof req.body.options == "string") {
                        options = JSON.parse(req.body.options);
                    } else {
                        options = req.body.options;
                    }
                }
                options.host = req.headers.host;
                httpProxy.get(req.body.url, options, function (err, result) {
                    processResponse(res, err, result);
                });
            }
        } catch (err) {
            next(err);
        }
    }

    POST.apiDoc = {
        summary: "Send a request to a different domain",
        security: [{ loginScheme: [] }],
        operationId: "httpProxy",
        parameters: [],
        responses: {
            default: {
                description: "Response provided by the proxied server",
            },
        },
    };

    function GET(req, res, next) {
        try {
            httpProxy.get(req.query, function (err, result) {
                processResponse(res, err, result);
            });
        } catch (e) {
            next(e);
        }
    }

    return operations;
};
