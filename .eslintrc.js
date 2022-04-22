module.exports = {
    parser: "@typescript-eslint/parser",
    settings: {
        react: {
            version: "detect",
        },
    },
    extends: ["plugin:prettier/recommended", "eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react/recommended"],

    rules: {
        "no-console": ["error", { allow: ["error", "warn"] }],
        "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true, varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
    },
    overrides: [
        /**
         * Backend files
         */
        {
            files: ["app.js", "scripts/*.js", "routes/*.js", "other/**/*.js", "bin/**/*.js", "api/**/*.js", "**/webpack.config.js", ".eslintrc.js", "model/**/*.js"],
            env: {
                node: true,
            },
            rules: {
                "@typescript-eslint/no-var-requires": "off",
                "no-console": "off",
            },
        },
        /**
         * Jest unit tests
         */
        {
            extends: ["plugin:jest/recommended"],
            files: ["tests/**/*.js"],
            env: {
                node: true,
                "jest/globals": true,
            },
            rules: {
                "@typescript-eslint/no-var-requires": "off",
            },
        },
        /**
         * Frontend files
         */
        {
            files: ["public/**/*.js"],
            globals: {
                $: "readable",
                Admin: "readable",
                Blender: "readable",
                C2S: "readable",
                Clipboard: "readable",
                stopInterv: "writable",
                Collection: "readable",
                Config: "writable",
                CustomPluginController: "readable",
                ElasticSearchProxy: "readable",
                Evaluate: "readable",
                Export: "readable",
                Genealogy: "readable",
                GraphController: "readable",
                GraphFilter: "readable",
                GraphTraversal: "readable",
                JsonEditor: "readable",
                KGadvancedMapping: "readable",
                KGassetGraph: "readable",
                KGbrowser: "readable",
                KGbrowserCustom: "readable",
                KGbrowserDataTable: "readable",
                KGbrowserGraph: "readable",
                KGbrowserQuery: "readable",
                KGbuild: "readable",
                KGcommon: "readable",
                KGcreator: "readable",
                KGmappingData: "readable",
                KGmappingGraph: "readable",
                KGmappings: "readable",
                KGquery: "readable",
                Lineage_blend: "readable",
                Lineage_classes: "readable",
                Lineage_common: "readable",
                Lineage_decoration: "readable",
                Lineage_properties: "writable",
                Lineage_relations: "readable",
                Lineage_types: "readable",
                MainController: "readable",
                OwlSchema: "readable",
                Schema: "readable",
                SearchUtil: "readable",
                SourceBrowser: "readable",
                SourceEditor: "readable",
                SourceMatcher: "readable",
                Sparql_INDIVIDUALS: "readable",
                Sparql_ISO_15926: "readable",
                Sparql_ISO_15926_part4: "readable",
                Sparql_OWL: "readable",
                Sparql_SKOS: "readable",
                Sparql_common: "readable",
                Sparql_endpoint: "readable",
                Sparql_generic: "readable",
                Sparql_proxy: "readable",
                Sparql_schema: "readable",
                Sparql_WORDNET: "readable",
                SQLquery: "readable",
                Standardizer: "readable",
                Sunburst: "readable",
                TE_14224_browser: "readable",
                TE_AssetConfigurator: "readable",
                TE_AssetDataManager: "readable",
                TE_SqlTojstreeConnectors: "readable",
                TextAnnotator: "readable",
                TreeController: "readable",
                Treemap: "readable",
                YASR: "readable",
                Yasgui: "readable",
                arc: "readable",
                arcTween: "readable",
                async: "readable",
                authentication: "readable",
                blinkVisjsNode: "readable",
                broadcastChannel: "readable",
                buildPaths: "readable",
                call: "readable",
                callback: "readable",
                classUrisBySource: "readable",
                click: "readable",
                common: "readable",
                computeTextRotation: "readable",
                constraintsMap: "writable",
                context: "readable",
                d3: "readable",
                dataTable: "readable",
                defaultNodeShape: "writable",
                dialogLarge: "readable",
                displaySampleData: "readable",
                domain: "readable",
                download: "readable",
                drawRootNode: "writable",
                fill: "readable",
                filter_min_arc_size_text: "readable",
                formatVariableName: "readable",
                h: "readable",
                i: "readable",
                insertTriplesStr: "readable",
                item: "readable",
                jstreeData: "readable",
                key: "readable",
                leftPanelWidth: "readable",
                message: "readable",
                mouseMoveArc: "readable",
                mouseOutArc: "readable",
                mouseOverArc: "readable",
                node: "readable",
                nodeData: "readable",
                nul: "readable",
                partition: "readable",
                payload: "readable",
                prop: "readable",
                propId: "writable",
                query: "readable",
                radius: "readable",
                rangeSource: "readable",
                rightPanelWidth: "readable",
                showOlderGenealogyOnly: "readable",
                socket: "readable",
                source: "writable",
                sourceColors: "writable",
                sourceVariables: "readable",
                sparql_abstract: "readable",
                svg: "readable",
                table: "readable",
                text: "readable",
                toutlesensController: "readable",
                typeObj: "readable",
                updateArc: "readable",
                vis: "readable",
                visJsDataProcessor: "readable",
                visjsGraph: "readable",
                w: "readable",
                yasr: "readable",
            },
            rules: {
                "no-constant-condition": "warn",
                "no-empty-function": "warn",
                "no-unreachable": "warn",
            },
            env: { browser: true },
        },
        {
            files: ["mainapp/src/**/*.ts", "mainapp/src/**/*.tsx"],

            extends: [
                "plugin:prettier/recommended",
                "eslint:recommended",
                "plugin:@typescript-eslint/recommended-requiring-type-checking",
                "plugin:@typescript-eslint/recommended",
                "plugin:react/recommended",
            ],
            parserOptions: {
                ecmaVersion: 2018,
                sourceType: "module",
                tsconfigRootDir: __dirname,
                project: "mainapp/tsconfig.json",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            rules: {
                "@typescript-eslint/no-misused-promises": [
                    "error",
                    {
                        checksVoidReturn: {
                            arguments: false,
                            attributes: false,
                        },
                    },
                ],
                "@typescript-eslint/explicit-function-return-type": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/ban-types": [
                    "error",
                    {
                        extendDefaults: true,
                        types: {
                            "{}": false,
                        },
                    },
                ],
                "react/prop-types": "off",
            },
        },
    ],
};
