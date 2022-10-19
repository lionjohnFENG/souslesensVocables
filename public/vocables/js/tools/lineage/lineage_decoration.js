//@typescript-eslint/no-unused-vars
var Lineage_decoration = (function () {
    var self = {};

    self.topOntologiesClassesMap = {};
    self.legendMap = {};
    self.currentVisjGraphNodesMap = {};
    var topLevelOntologyFixedlegendMap = {
        "ISO_15926-part-14_PCA": {
            "http://rds.posccaesar.org/ontology/lis14/rdl/Location": "#F90EDDFF",
            "http://rds.posccaesar.org/ontology/lis14/rdl/PhysicalObject": "#00AFEFFF",
            "http://rds.posccaesar.org/ontology/lis14/rdl/FunctionalObject": "#FDBF01FF",
            "http://rds.posccaesar.org/ontology/lis14/rdl/InformationObject": "#70AC47FF",
            "http://rds.posccaesar.org/ontology/lis14/rdl/Activity": "#70309f",
            "http://rds.posccaesar.org/ontology/lis14/rdl/Aspect": "#cb6601",
        },
        BFO: {
            "http://purl.obolibrary.org/obo/BFO_0000030": "#00AFEFFF",
            "http://purl.obolibrary.org/obo/BFO_0000024": "#00AFEFFF",
            "http://purl.obolibrary.org/obo/BFO_0000027": "#00AFEFFF",
            "http://purl.obolibrary.org/obo/BFO_0000145": "#cb6601",
            "http://purl.obolibrary.org/obo/BFO_0000023": "#cb6601",
            "http://purl.obolibrary.org/obo/BFO_0000016": "#cb6601",
            "http://purl.obolibrary.org/obo/BFO_0000019": "#cb6601",
            "http://purl.obolibrary.org/obo/BFO_0000017": "#cb6601",
            "http://purl.obolibrary.org/obo/BFO_0000006": "#F90EDDFF",
            "http://purl.obolibrary.org/obo/BFO_0000029": "#F90EDDFF",
            "http://purl.obolibrary.org/obo/BFO_0000140": "#F90EDDFF",
            "http://purl.obolibrary.org/obo/BFO_0000182": "#70309f",
            "http://purl.obolibrary.org/obo/BFO_0000144": "#70309f",
            "http://purl.obolibrary.org/obo/BFO_0000148": "#70309f",
            "http://purl.obolibrary.org/obo/BFO_0000038": "#70309f",
            "http://purl.obolibrary.org/obo/BFO_0000203": "#70309f",
            "http://purl.obolibrary.org/obo/BFO_0000015": "#70309f",
            "http://purl.obolibrary.org/obo/BFO_0000008": "#70309f",
        },
        DOLCE: {},
    };
    self.topLevelOntologyPredifinedLegendMap = JSON.parse(JSON.stringify(topLevelOntologyFixedlegendMap));

    self.init = function () {
        self.operationsMap = {
            colorNodesByType: self.colorGraphNodesByType,
            colorNodesByTopLevelOntologyTopType: self.colorNodesByTopLevelOntologyTopType,
        };
        var operations = Object.keys(self.operationsMap);

        common.fillSelectOptions("Lineage_classes_graphDecoration_operationSelect", operations, true);
        self.currentVisjGraphNodesMap = {};
        self.legendMap = {};
    };
    self.run = function (operation) {
        $("#Lineage_classes_graphDecoration_operationSelect").val("");
        self.operationsMap[operation]();
    };

    self.showGraphDecorationDialog = function () {
        $("#mainDialogDiv").load("snippets/lineage/graphDecoration.html", function () {
            $("#mainDialogDiv").dialog("open");
        });
    };

    /**
     * set the upper ontology classes map
     * @param callback
     * @returns {*}
     */
    self.setTopLevelOntologyClassesMap = function (callback) {
        if (!Config.currentTopLevelOntology) return callback(null, null);

        if (self.topOntologiesClassesMap[Config.currentTopLevelOntology]) {
            self.currentTopOntologyClassesMap = self.topOntologiesClassesMap[Config.currentTopLevelOntology];
            return callback(null, self.currentTopOntologyClassesMap);
        }
        self.currentTopOntologyClassesMap = {};
        Sparql_generic.getSourceTaxonomy(Config.currentTopLevelOntology, {}, function (err, result) {
            if (err) return callback(null, {});

            self.currentTopOntologyClassesMap = result.classesMap;
            var countColors = 0;
            for (var topClass in self.currentTopOntologyClassesMap) {
                var color = null;
                if (self.topLevelOntologyPredifinedLegendMap[Config.currentTopLevelOntology][topClass])
                    //predifined color
                    color = self.topLevelOntologyPredifinedLegendMap[Config.currentTopLevelOntology][topClass];
                else {
                    //look for a predifined parent class
                    self.currentTopOntologyClassesMap[topClass].parents.forEach(function (parent) {
                        if (self.topLevelOntologyPredifinedLegendMap[Config.currentTopLevelOntology][parent])
                            //predifined color
                            color = self.topLevelOntologyPredifinedLegendMap[Config.currentTopLevelOntology][parent];
                    });
                }
                if (!color)
                    //calculated color in palette
                    color = common.paletteIntense[countColors % Object.keys(common.paletteIntense).length];
                self.currentTopOntologyClassesMap[topClass].color = color;
                countColors++;
            }
            return callback(null, self.currentTopOntologyClassesMap);
        });
    };

    /**
   search for each node in visjs graph correpsonding nodes in upper ontology (if any)
   an set the lowest upper ontology class thanks to the self.currentTopOntologyClassesMap[topclass].parents nodes length

   */

    self.getVisjsClassNodesTopLevelOntologyClass = function (ids, callback) {
        if (!ids || ids.length == 0) return callback(null, []);

        var sourceLabel = Lineage_classes.mainSource;

        var strFrom = Sparql_common.getFromStr(sourceLabel, null, true, true);
        var sparql_url = Config.sources[sourceLabel].sparql_server.url;
        var url = sparql_url + "?format=json&query=";
        var slices = common.array.slice(ids, 50);
        var uriPattern = Config.topLevelOntologies[Config.currentTopLevelOntology].uriPattern;
        var data = [];
        async.eachSeries(
            slices,
            function (slice, callbackEach) {
                var query =
                    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
                    "PREFIX owl: <http://www.w3.org/2002/07/owl#>";

                query +=
                    "  SELECT distinct ?x ?type ?g ?label" +
                    strFrom +
                    "WHERE {GRAPH ?g{" +
                    "    ?x  rdf:type owl:Class. " +
                    "OPTIONAL {?x rdfs:label ?label}" +
                    " ?x   rdfs:subClassOf* ?type.  filter(regex(str(?type),'" +
                    uriPattern +
                    "'))";

                /*   query += "  SELECT distinct ?x ?type ?g ?label" +
strFrom +
"WHERE {GRAPH ?g{" +
"    ?x  rdf:type ?s. " +
"OPTIONAL {?x rdfs:label ?label}" +
" ?x  (rdf:type|rdfs:subClassOf)+ ?type.  filter(regex(str(?type),'" + self.uriPattern + "'))";*/

                var filter = Sparql_common.setFilter("x", slice);
                if (filter.indexOf("?x in( )") > -1) return callbackEach();

                query += filter + "}}";
                Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: sourceLabel }, function (err, result) {
                    if (err) {
                        return callback(err);
                    }
                    data = data.concat(result.results.bindings);
                    //  if (data.length > 100) ; // console.error(query);
                    return callbackEach();
                });
            },
            function (err) {
                return callback(err, data);
            }
        );
    };

    self.getVisjsNamedIndividualNodesClass = function (ids, callback) {
        if (!ids || ids.length == 0) return callback(null, []);

        var sourceLabel = Lineage_classes.mainSource;

        var strFrom = Sparql_common.getFromStr(sourceLabel, null, true, true);
        var sparql_url = Config.sources[sourceLabel].sparql_server.url;
        var url = sparql_url + "?format=json&query=";
        var slices = common.array.slice(ids, 50);
        //  var uriPattern = Config.topLevelOntologies[Config.currentTopLevelOntology].uriPattern;
        var data = [];
        async.eachSeries(
            slices,
            function (slice, callbackEach) {
                var query =
                    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
                    "PREFIX owl: <http://www.w3.org/2002/07/owl#>";

                query +=
                    "  SELECT distinct ?x ?class ?g ?label" +
                    strFrom +
                    "WHERE {GRAPH ?g{" +
                    "    ?x  rdf:type owl:NamedIndividual. " +
                    "OPTIONAL {?x rdfs:label ?label}" +
                    "  ?x   rdf:type+ ?class.  ?class rdf:type owl:Class ";

                var filter = Sparql_common.setFilter("x", slice);
                if (filter.indexOf("?x in( )") > -1) return callbackEach();

                query += filter + "}}";
                Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: sourceLabel }, function (err, result) {
                    if (err) {
                        return callback(err);
                    }
                    data = data.concat(result.results.bindings);
                    //  if (data.length > 100) ; // console.error(query);
                    return callbackEach();
                });
            },
            function (err) {
                return callback(err, data);
            }
        );
    };

    self.colorGraphNodesByType = function (visjsNodes) {
        Lineage_classes.setTopLevelOntologyFromImports(Lineage_classes.mainSource);

        if (!Config.topLevelOntologies[Config.currentTopLevelOntology]) return;

        self.currentVisjGraphNodesMap = {};
        if (false && self.currentTopOntologyClassesMap && Object.keys(self.currentTopOntologyClassesMap).length > 0) return self.colorNodesByTopLevelOntologyTopType(visjsNodes);

        self.setTopLevelOntologyClassesMap(function (err, result) {
            if (Config.topLevelOntologies[Config.currentTopLevelOntology]) {
                // self.legendMap = {};
                self.uriPattern = Config.topLevelOntologies[Config.currentTopLevelOntology].uriPattern;
                self.colorNodesByTopLevelOntologyTopType(visjsNodes);
            } else return;
        });
    };
    self.clearLegend = function () {
        $("#Lineage_classes_graphDecoration_legendDiv").html("");
        self.legendMap = {};
    };

    self.colorNodesByTopLevelOntologyTopType = function (visjsNodes) {
        if (!Config.topLevelOntologies[Config.currentTopLevelOntology]) return;

        var nonTopLevelOntologynodeIds = [];
        var topLevelOntologynodeIds = [];
        var individualNodes = {};
        if (!visjsNodes) visjsNodes = visjsGraph.data.nodes.get();

        if (visjsNodes.length == 0) return;

        async.series(
            [
                // split nodes by type
                function (callbackSeries) {
                    visjsNodes.forEach(function (node) {
                        if (node.data && node.data.rdfType == "NamedIndividual") individualNodes[node.id] = {};
                        else if (true || node.id.indexOf(self.uriPattern) < 0) {
                            nonTopLevelOntologynodeIds.push(node.id);
                        } else {
                            if (self.currentTopOntologyClassesMap[node.id])
                                topLevelOntologynodeIds.push({
                                    id: node.id,
                                    color: self.currentTopOntologyClassesMap[node.id].color,
                                });
                        }
                    });
                    visjsGraph.data.nodes.update(topLevelOntologynodeIds);
                    callbackSeries();
                },
                //get individuals class and add it to nonTopLevelOntologynodeIds
                function (callbackSeries) {
                    self.getVisjsNamedIndividualNodesClass(Object.keys(individualNodes), function (err, result) {
                        if (err) return;
                        result.forEach(function (item) {
                            individualNodes[item.x.value] = item.class.value;
                            if (nonTopLevelOntologynodeIds.indexOf(item.class.value) < 0) nonTopLevelOntologynodeIds.push(item.class.value);
                        });
                        callbackSeries();
                    });
                },

                // set nodes topClasses
                function (callbackSeries) {
                    self.getVisjsClassNodesTopLevelOntologyClass(nonTopLevelOntologynodeIds, function (err, result) {
                        if (err) return;
                        var excludedTypes = ["TopConcept", "Class", "Restriction"];

                        var maxNumberOfParents = 0;

                        result.forEach(function (item) {
                            if (!self.currentVisjGraphNodesMap[item.x.value]) {
                                self.currentVisjGraphNodesMap[item.x.value] = {
                                    type: item.type.value,
                                    graphUri: item.g.value,
                                    label: item.label ? item.label.value : Sparql_common.getLabelFromURI(item.x.value),
                                    topLevelOntologyClass: null,
                                    topLevelOntologyNumberOfParents: 0,
                                    color: null,
                                };
                            }
                            if (self.currentTopOntologyClassesMap[item.x.value]) {
                                self.currentVisjGraphNodesMap[item.x.value].topLevelOntologyClass = item.x.value;
                                self.currentVisjGraphNodesMap[item.x.value].color = self.currentTopOntologyClassesMap[item.x.value].color;
                                self.currentVisjGraphNodesMap[item.x.value].type = item.x.value;
                                self.currentVisjGraphNodesMap[item.x.value].topLevelOntologyNumberOfParents = self.currentTopOntologyClassesMap[item.type.value].parents.length;
                            } else if (self.currentTopOntologyClassesMap[item.type.value]) {
                                // select the deepest upper ontology class  among all retrieved
                                if (self.currentTopOntologyClassesMap[item.type.value].parents.length > self.currentVisjGraphNodesMap[item.x.value].topLevelOntologyNumberOfParents) {
                                    self.currentVisjGraphNodesMap[item.x.value].topLevelOntologyClass = item.type.value;
                                    self.currentVisjGraphNodesMap[item.x.value].color = self.currentTopOntologyClassesMap[item.type.value].color;
                                    self.currentVisjGraphNodesMap[item.x.value].type = item.type.value;
                                    self.currentVisjGraphNodesMap[item.x.value].topLevelOntologyNumberOfParents = self.currentTopOntologyClassesMap[item.type.value].parents.length;
                                }
                            }
                        });
                        callbackSeries();
                    });
                },
                // prepare legend
                function (callbackSeries) {
                    for (var nodeId in self.currentVisjGraphNodesMap) {
                        var node = self.currentVisjGraphNodesMap[nodeId];
                        if (!self.legendMap[node.topLevelOntologyClass]) {
                            var topClass = self.currentTopOntologyClassesMap[node.topLevelOntologyClass];
                            if (topClass) {
                                self.legendMap[node.topLevelOntologyClass] = {
                                    id: node.topLevelOntologyClass,
                                    label: topClass.label,
                                    color: topClass.color,
                                    parents: topClass.parents,
                                };
                            }
                        }
                    }
                    callbackSeries();
                },

                // update nodes color
                function (callbackSeries) {
                    // modify nodes color according to toOntolog superClass
                    var neutralColor = null; //"#ccc";

                    var newNodes = [];
                    for (var nodeId in self.currentVisjGraphNodesMap) {
                        var obj = self.currentVisjGraphNodesMap[nodeId];
                        if (obj) newNodes.push({ id: nodeId, color: obj.color, legendType: obj.type });

                        /*
  var source2 = nodesTypesMap[node.data.id].graphUri ? Sparql_common.getSourceFromGraphUri(nodesTypesMap[node.data.id].graphUri) : source;
  if (source2) node.data.source = source2;*/
                    }

                    for (var individualId in individualNodes) {
                        var classId = individualNodes[individualId];
                        var obj = self.currentVisjGraphNodesMap[classId];
                        if (obj) newNodes.push({ id: individualId, color: obj.color, legendType: obj.type });
                    }

                    if (visjsGraph.data && visjsGraph.data.nodes) visjsGraph.data.nodes.update(newNodes);

                    callbackSeries();
                },
                function (callbackSeries) {
                    self.drawLegend();
                    callbackSeries();
                },
            ],
            function (err) {}
        );
    };

    self.drawLegend = function () {
        if (!Config.currentTopLevelOntology) return;

        /*
   var  str = "<div>Upper ontology <b>" + Config.currentTopLevelOntology + "</b>" +
      " <button class=\"btn btn-sm my-1 py-0 btn-outline-primary\" onclick='Lineage_decoration.hideShowLegendType(null,\"all\")'>show All</button>" +
      "</div>";
    $("#Lineage_classes_graphDecoration_UpperOntologyDiv").html(str);
    */

        var str = "<div  class='Lineage_legendTypeTopLevelOntologyDiv' style='display: flex;>";

        // group topClasses
        /*   var groups={"no-group":[]}
    for (var topClassId in self.legendMap) {
      var topClass=self.legendMap[topClassId]
      topClass.parents.forEach(function(parent){
        if( self.topLevelOntologyPredifinedLegendMap[Config.currentTopLevelOntology][parent] ){
          if(!groups[parent])
          groups[parent]=[]
          groups[parent].push(topClassId)
        }else{
          groups["no-group"].push(topClassId)
        }
      })
    }*/
        var jstreeData = [];
        var uniqueIds = {};
        for (var topClassId in self.legendMap) {
            var topClass = self.legendMap[topClassId];
            topClass.parents.push(topClassId);
            topClass.parents.forEach(function (id, index) {
                var parent;
                var color = null,
                    label = "-";
                if (index == 0) {
                    label = topClass.parents[index];
                    parent = "#";
                } else {
                    parent = topClass.parents[index - 1];

                    if (self.currentTopOntologyClassesMap[id]) {
                        color = self.currentTopOntologyClassesMap[id].color;
                        label = self.currentTopOntologyClassesMap[id].label;
                    }
                }
                if (!uniqueIds[id]) {
                    uniqueIds[id] = 1;
                    jstreeData.push({
                        id: id,
                        text: "<span  style='font-size:10px;background-color:" + color + "'>&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;" + label,
                        parent: parent,
                    });
                }
            });
        }

        var options = {
            openAll: true,
            withCheckboxes: true,
            onCheckNodeFn: Lineage_decoration.onLegendCheckBoxes,
            onUncheckNodeFn: Lineage_decoration.onLegendCheckBoxes,
            tie_selection: false,
        };

        $("#Lineage_classes_graphDecoration_legendDiv").html("<div  class='jstreeContainer' style='height: 300px;width:320px'<div id='Lineage_classes_graphDecoration_legendTreeDiv'></div></div>");
        common.jstree.loadJsTree("Lineage_classes_graphDecoration_legendTreeDiv", jstreeData, options, function () {
            $("#Lineage_classes_graphDecoration_legendTreeDiv").jstree(true).check_all();
        });

        return;

        if (false) {
            for (var group in groups) {
                var label = self.legendMap[topClassId].label;
                var color = self.legendMap[topClassId].color;
                str += "<div class='Lineage_legendTypeDiv'>";
                groups[group].forEach(function (topClassId) {
                    var label = self.legendMap[topClassId].label;
                    var color = self.legendMap[topClassId].color;
                    str +=
                        "<div class='Lineage_legendTypeDiv' onclick='Lineage_decoration.onlegendTypeDivClick($(this),\"" +
                        topClassId +
                        "\")' style='background-color:" +
                        color +
                        "'>" +
                        label +
                        "</div>";
                });
                str += "</div>";
            }

            return;
        }

        for (var topClassId in self.legendMap) {
            var label = self.legendMap[topClassId].label;
            var color = self.legendMap[topClassId].color;
            str += "<div class='Lineage_legendTypeDiv' onclick='Lineage_decoration.onlegendTypeDivClick($(this),\"" + topClassId + "\")' style='background-color:" + color + "'>" + label + "</div>";
        }
        str += "</div>";

        $("#Lineage_classes_graphDecoration_legendDiv").html(str);
    };

    self.onLegendCheckBoxes = function () {
        var checkdeTopClassesIds = $("#Lineage_classes_graphDecoration_legendTreeDiv").jstree(true).get_checked();

        var allNodes = visjsGraph.data.nodes.get();
        var newNodes = [];
        allNodes.forEach(function (node) {
            var hidden = true;
            if (node && checkdeTopClassesIds.indexOf(node.legendType) > -1) hidden = false;

            newNodes.push({
                id: node.id,
                hidden: hidden,
            });
        });
        visjsGraph.data.nodes.update(newNodes);
    };

    self.onlegendTypeDivClick = function (div, type) {
        self.currentLegendObject = { type: type, div: div };
        self.setGraphPopupMenus();
        var point = div.position();
        point.x = point.left;
        point.y = point.top;
        MainController.UI.showPopup(point, "graphPopupDiv", true);
    };

    self.setGraphPopupMenus = function () {
        var html =
            '    <span  class="popupMenuItem" onclick="Lineage_decoration.hideShowLegendType(true);"> Hide Type</span>' +
            ' <span  class="popupMenuItem" onclick="Lineage_decoration.hideShowLegendType();"> Show Type</span>' +
            ' <span  class="popupMenuItem" onclick="Lineage_decoration.hideShowLegendType(null,true);"> Show Only</span>';
        $("#graphPopupDiv").html(html);
    };
    self.hideShowLegendType = function (hide, only) {
        if (hide) self.currentLegendObject.div.addClass("Lineage_legendTypeDivHidden");
        else self.currentLegendObject.div.removeClass("Lineage_legendTypeDivHidden");
        var allNodes = visjsGraph.data.nodes.get();
        var newNodes = [];
        var hidden = hide ? true : false;
        allNodes.forEach(function (node) {
            if (only) {
                if (only == "all" || (node && node.legendType == self.currentLegendObject.type))
                    newNodes.push({
                        id: node.id,
                        hidden: false,
                    });
                else newNodes.push({ id: node.id, hidden: true });
            } else {
                if (node && node.legendType == self.currentLegendObject.type)
                    newNodes.push({
                        id: node.id,
                        hidden: hidden,
                    });
            }
        });
        visjsGraph.data.nodes.update(newNodes);
    };

    return self;
})();
