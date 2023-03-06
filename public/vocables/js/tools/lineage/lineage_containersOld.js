var Lineage_containers = (function () {
    var self = {};

    self.getContextJstreeMenu = function () {
        var items = {};
        items["NodeInfos"] = {
            label: "Node infos",
            action: function (_e) {
                SourceBrowser.showNodeInfos(Lineage_sources.activeSource, self.currentContainer, "mainDialogDiv");
            },
        };
        items["GraphNode"] = {
            label: "Graph node",
            action: function (_e) {
                if (self.currentContainer.data.type == "container") Lineage_containers.graphResources(Lineage_sources.activeSource, self.currentContainer.id, { onlyChildren: true });
                else Lineage_classes.drawNodesAndParents(self.currentContainer, 0);
            },
        };
        items["openAll"] = {
            label: "Open all",
            action: function (_e) {
                $("#lineage_containers_containersJstree").jstree().open_all(self.currentContainer.id);
            },
        };

        items["AddGraphNode"] = {
            label: "Add selected node to container",
            action: function (_e) {
                var graphNodeData = Lineage_classes.currentGraphNode.data;
                Lineage_containers.addResourcesToContainer(Lineage_sources.activeSource, self.currentContainer.data, graphNodeData);
            },
        };

        items["DeleteContainer"] = {
            label: "Delete container",
            action: function (_e) {
                Lineage_containers.deleteContainer(Lineage_sources.activeSource, self.currentContainer.data.id);
            },
        };

        items["GraphContainerDescendantContainers"] = {
            label: "Graph  descendants containers",
            action: function (_e) {
                Lineage_containers.graphResources(Lineage_sources.activeSource, self.currentContainer.data.id, { bags: true });
            },
        };
        /*    items["GraphResources"] = {
    label: "Graph container resources",
    action: function (_e) {
        Lineage_containers.graphResources(Lineage_sources.activeSource, self.currentContainer.data.id, { nodes: true });
    },
};*/

        items["GraphContainerDescendantResources"] = {
            label: "Graph  descendants resources",
            action: function (_e) {
                Lineage_containers.graphResources(Lineage_sources.activeSource, self.currentContainer.data.id, { nodes: true });
            },
        };

        items["GraphContainerSetStyle"] = {
            label: "Set Style",
            action: function (_e) {
                Lineage_styles.showDialog(self.currentContainer.data);
            },
        };
        /*  items["GraphContainerAncestors"] = {
label: "Graph container ancestors",
action: function(_e) {
Lineage_containers.graphResources(Lineage_sources.activeSource, self.currentContainer.data.id, { containers:true,ancestors: true });
}
};*/

        /*  items["GraphResourcesDescendants"] = {
label: "Graph container and all resources",
action: function(_e) {
Lineage_containers.graphResources(Lineage_sources.activeSource, self.currentContainer.data.id, { nodes:true,descendants:true});
}
};*/

        return items;
    };
    self.search = function () {
        if ($("#lineage_containers_containersJstree").jstree) $("#lineage_containers_containersJstree").empty();

        self.currentContainer = null;
        var term = $("#Lineage_containers_searchInput").val();
        var searchWhat = $("#Lineage_containers_searchWhatInput").val();
        var source = Lineage_sources.activeSource;

        var filter = "";
        if (term) filter = Sparql_common.setFilter("member", null, term);
        var memberType;
        if (searchWhat == "bags") memberType = " in (rdf:Bag,rdf:List)";
        if (searchWhat == "classes") memberType = "=owl:Class";
        if (searchWhat == "individuals") memberType = "=owl:NamedIndividual";
        else if (searchWhat == "nodes") memberType = " in (owl:Class,owl:NamedIndividual)";

        if (searchWhat != "bags" && !term) return alert("enter a term to search for");

        var fromStr = Sparql_common.getFromStr(source, null, true);
        var query =
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "select distinct * " +
            fromStr +
            "where {?member rdfs:label ?memberLabel.?member rdf:type ?memberType  filter(?memberType" +
            memberType +
            ")" +
            " OPTIONAL {?member ^rdfs:member ?parentContainer.?parentContainer rdf:type ?type.filter (?type in (rdf:Bag,rdf:List)).?parentContainer rdfs:label ?parentContainerLabel}" +
            filter +
            "}";
        var sparql_url = Config.sources[source].sparql_server.url;
        var url = sparql_url + "?format=json&query=";

        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: source }, function (err, result) {
            if (err) return alert(err.responseText);

            var nodesMap = {};
            result.results.bindings.forEach(function (item) {
                //  var nodeId=item.parent+"_"+item.member.value

                nodesMap[item.member.value] = item;
            });

            var jstreeData = [];

            for (var nodeId in nodesMap) {
                if (nodeId == "http://datalenergies.total.com/resource/tsf/iso-14224-bags/bag/ISO-142224") var x = 3;
                var item = nodesMap[nodeId];
                var parent = "#";
                if (item.parentContainer) {
                    parent = item.parentContainer.value;
                    if (item.parentContainer.value == nodeId) parent = "#";
                    if (!nodesMap[item.parentContainer.value]) {
                        var parentNode = {
                            id: parent,
                            text: item.parentContainerLabel.value,
                            parent: "#",
                            data: {
                                type: "container",
                                source: source,
                                id: parent,
                                text: item.parentContainer.value,
                                currentParent: "#",
                            },
                        };
                        jstreeData.push(parentNode);
                    }
                }
                var memberType = "resource";
                if (item.memberType && item.memberType.value.indexOf("Bag") > -1) memberType = "container";
                var node = {
                    id: nodeId,
                    text: item.memberLabel.value,
                    parent: parent,
                    data: {
                        type: memberType,
                        source: source,
                        id: item.member.value,
                        text: item.memberLabel.value,
                        currentParent: parent,
                    },
                };
                jstreeData.push(node);
            }

            var options = {
                openAll: false,
                contextMenu: Lineage_containers.getContextJstreeMenu(),
                selectTreeNodeFn: Lineage_containers.onSelectedNodeTreeclick,
                dnd: {
                    drag_stop: function (data, element, helper, event) {
                        self.onMoveContainer(data, element, helper, event);
                    },
                    drag_start: function (data, element, helper, event) {
                        var sourceNodeId = element.data.nodes[0];
                        self.currenDraggingNodeSourceParent = $("#lineage_containers_containersJstree").jstree().get_node(sourceNodeId).parent;
                    },
                },
            };

            common.jstree.loadJsTree("lineage_containers_containersJstree", jstreeData, options, function () {
                $("#lineage_containers_containersJstree").jstree().open_node("#");
            });
        });
    };

    self.addContainer = function (source) {
        if (!source) source = Lineage_sources.activeSource;

        var newContainerLabel = prompt("enter new container label)");
        if (!newContainerLabel) return;

        var containerUri = Config.sources[source].graphUri + "bag/" + common.formatStringForTriple(newContainerLabel, true);

        var triples = [];

        if (self.currentContainer && self.currentContainer.id != containerUri) {
            triples.push({
                subject: "<" + self.currentContainer.data.id + ">",
                predicate: " rdfs:member",
                object: "<" + containerUri + ">",
            });
        }

        triples.push({
            subject: "<" + containerUri + ">",
            predicate: " rdf:type",
            object: "<http://www.w3.org/1999/02/22-rdf-syntax-ns#Bag>",
        });
        triples.push({
            subject: containerUri,
            predicate: " rdfs:label",
            object: newContainerLabel,
        });
        Sparql_generic.insertTriples(source, triples, null, function (err, result) {
            if (err) return alert(err.responseText);
            var parent = self.currentContainer || "#";
            var newNode = {
                id: containerUri,
                text: newContainerLabel,
                parent: parent,
                data: {
                    type: "container",
                    source: source,
                    id: containerUri,
                    label: newContainerLabel,
                },
            };

            if (!$("#lineage_containers_containersJstree").jstree) {
                // initialize jstree
                self.search(function (err, result) {
                    $("#lineage_containers_containersJstree")
                        .jstree()
                        .create_node(parent, newNode, "first", function (err, result) {
                            $("#lineage_containers_containersJstree").jstree().open_node(parent);
                        });
                });
            } else {
                $("#lineage_containers_containersJstree")
                    .jstree()
                    .create_node(parent, newNode, "first", function (err, result) {
                        $("#lineage_containers_containersJstree").jstree().open_node(parent);
                    });
            }

            self.currentContainer = null;
        });
    };

    /**
     *
     * add nodes to a container(owl:bag)
     *
     *
     * @param source
     * @param container
     * @param nodesData
     * @param drawMembershipEdge add the edge (and the node) on the vizGraph
     */
    self.addResourcesToContainer = function (source, container, nodesData, drawMembershipEdge, callback) {
        if (container.type != "container") return alert("can only add resources to containers");
        // self.currentContainer=null;
        if (!Array.isArray(nodesData)) nodesData = [nodesData];

        var otherSourcesNodes = [];
        var triples = [];
        nodesData.forEach(function (nodeData) {
            if (container.id == nodeData.id) return alert("a  node cannot be member of itself");

            if (!nodeData.source) return console.log(" node without source");
            if (true || nodeData.source == source) {
                triples.push({
                    subject: "<" + container.id + ">",
                    predicate: "<http://www.w3.org/2000/01/rdf-schema#member>",
                    object: "<" + nodeData.id + ">",
                });
            } else {
                otherSourcesNodes.push(node.id);
            }
        });

        Sparql_generic.insertTriples(source, triples, null, function (err, result) {
            if (err) {
                if (callback) return callback(err);
                return alert(err.responseText);
            }
            MainController.UI.message("nodes added to container " + container.label);
            var jstreeData = [];
            nodesData.forEach(function (nodeData) {
                jstreeData.push({
                    id: nodeData.id,
                    text: nodeData.label,
                    parent: container.id,
                    type: "class",
                    data: {
                        type: "resource",
                        source: source,
                        id: nodeData.id,
                        label: nodeData.label,
                    },
                });
            });
            if ($("#lineage_containers_containersJstree").jstree) common.jstree.addNodesToJstree("lineage_containers_containersJstree", container.id, jstreeData);

            if (drawMembershipEdge) {
                var existingNodes = visjsGraph.getExistingIdsMap();
                var edges = [];
                nodesData.forEach(function (nodeData) {
                    var edgeId = container.id + "_" + "member" + "_" + nodeData.id;
                    if (!existingNodes[edgeId]) {
                        existingNodes[edgeId] = 1;
                        edges.push({
                            id: edgeId,
                            from: container.id,
                            to: nodeData.id,

                            data: { propertyId: "http://www.w3.org/2000/01/rdf-schema#member", source: source },
                            font: { multi: true, size: 10 },

                            //  dashes: true,
                            color: "#8528c9",
                        });
                    }
                });

                visjsGraph.data.edges.add(edges);
            }
            if (callback) return callback(null);
        });
    };

    self.deleteContainer = function (source, containerId) {
        if (!confirm("delete container)")) return;
        self.currentContainer = null;
        Sparql_generic.deleteTriples(source, containerId, null, null, function (err) {
            if (err) return alert(err.responseText);

            Sparql_generic.deleteTriples(source, null, null, containerId, function (err) {
                var node = $("#lineage_containers_containersJstree").jstree().get_node(containerId);
                if (node.children.length > 0) $("#lineage_containers_containersJstree").jstree().move_node(node.children, "#");
                $("#lineage_containers_containersJstree").jstree().delete_node(containerId);
            });
        });
    };

    self.getContainerResources = function (source, containerIds, options, callback) {
        var containers;
        var firstContainer;
        if (!Array.isArray(containerIds)) {
            containers = [containerIds];
            firstContainer = containerIds;
        } else {
            containers = containerIds;
            firstContainer = containerIds[0];
        }

        if (options.allDescendants) {
            //  $("#lineage_containers_containersJstree").jstree().open_all()
            var descendantObjs = common.jstree.getNodeDescendants("lineage_containers_containersJstree", firstContainer, null);
            var descendantIds = [];
            descendantObjs.forEach(function (item) {
                if (item.data.type == "container") descendantIds.push(item.data.id);
            });
            var containerObj = $("#lineage_containers_containersJstree").jstree().get_node(firstContainer);
            containers = containers.concat(descendantIds);
        }

        var subjects = containers;
        var objects = null;
        var propFilter = "";
        var objectTypeFilter;
        if (options.nodes) {
            objectTypeFilter = "filter(?objectType not in (rdf:Bag,rdf:List))";
        } else if (options.containers) {
            objectTypeFilter = "filter(?objectType in (rdf:Bag,rdf:List))";
        } else {
            objectTypeFilter = "";
        }

        if (options.descendants) {
            propFilter = "http://www.w3.org/2000/01/rdf-schema#member";
        } else if (options.ancestors) {
            var subjects = null;
            var objects = containers;
        } else {
            propFilter = "";
        }

        if (!propFilter && !objectTypeFilter) return alert("no filter set");

        Sparql_OWL.getFilteredTriples(source, subjects, propFilter, objects, { filter: objectTypeFilter }, function (err, result) {
            return callback(err, result);
        });
    };
    self.listContainerResources = function (source, containerId) {
        var existingChildren = common.jstree.getjsTreeNodes("lineage_containers_containersJstree", true, containerId);
        var filter = "filter(?objectType not in (rdf:Bag,redf:List))";
        self.getContainerResources(source, containerId, { nodes: true, descendants: true }, function (err, result) {
            if (err) return alert(err.responseText);
            var jstreeData = [];
            result.forEach(function (item) {
                if (existingChildren.indexOf(item.object.value) < 0) {
                    existingChildren.push(item.object.value);

                    jstreeData.push({
                        id: item.object.value,
                        text: item.objectLabel.value,
                        parent: item.subject.value,
                        type: "class",
                        data: {
                            type: "resource",
                            source: source,
                            id: item.object.value,
                            label: item.objectLabel.value,
                        },
                    });
                }
            });
            common.jstree.addNodesToJstree("lineage_containers_containersJstree", containerId, jstreeData);
        });
    };
    self.graphResources = function (source, containerId, options) {
        if (!options) options = {};
        var existingChildren = common.jstree.getjsTreeNodes("lineage_containers_containersJstree", true, containerId);

        var data = [];
        var descendants = [];
        var stylesMap = {};

        async.series(
            [
                //getContainers descendants type container
                function (callbackSeries) {
                    if (options.nodes) return callbackSeries();
                    options.nodes = false;
                    options.bags = true;
                    self.sparql_queries.getContainerDescendants(Lineage_sources.activeSource, containerId, options, function (err, result) {
                        if (err) return callbackSeries(err);
                        data = data.concat(result.results.bindings);
                        return callbackSeries();
                    });
                },
                //getContainers descendants type node
                function (callbackSeries) {
                    if (options.bags) return callbackSeries();
                    options.nodes = true;
                    options.bags = false;

                    self.sparql_queries.getContainerDescendants(Lineage_sources.activeSource, containerId, options, function (err, result) {
                        if (err) return callbackSeries(err);
                        data = data.concat(result.results.bindings);
                        return callbackSeries();
                    });
                },
                //get containersStyles
                function (callbackSeries) {
                    data.forEach(function (item) {
                        if (item.containerStyle) if (!stylesMap[item.container.value]) stylesMap[item.container.value] = { styleId: item.containerStyle.value };
                    });
                    var ids = Object.keys(stylesMap);
                    if (ids.length == 0) return callbackSeries();
                    Lineage_styles.init();
                    Lineage_styles.listStyles(ids, function (err, styles) {
                        if (err) return alert(err);
                        for (var containerId in stylesMap) {
                            var styleId = stylesMap[containerId];
                            var styleObj = styles[styleId];
                            if (styleObj) styleObj.id = styleId;
                            stylesMap[containerId] = styleObj;
                        }
                        return callbackSeries();
                    });
                },

                function (callbackSeries) {
                    var color = Lineage_classes.getSourceColor(source);
                    var opacity = 1.0;
                    var existingNodes = visjsGraph.getExistingIdsMap();
                    var visjsData = { nodes: [], edges: [] };
                    var objectProperties = [];

                    data.forEach(function (item) {
                        var shape = "dot";
                        var color2 = common.colorToRgba(color, opacity * 1);
                        var size = Lineage_classes.defaultShapeSize;

                        var containerStyle = stylesMap[item.container0.value];
                        if (containerStyle) {
                            shape = containerStyle.shape || shape;
                            color2 = containerStyle.color || color2;
                            size = containerStyle.size || colorsize2;
                        }

                        if (item.containerType.value == "http://www.w3.org/2002/07/owl#ObjectProperty") return objectProperties.push(item.container.value);
                        if (!existingNodes[item.container0.value]) {
                            existingNodes[item.container0.value] = 1;

                            var type = "container";
                            visjsData.nodes.push({
                                id: item.container0.value,
                                label: item.container0Label.value,
                                shadow: self.nodeShadow,
                                shape: type == "container" ? "box" : shape,
                                size: size,
                                font: type == "container" ? { color: "#eee" } : null,
                                color: color2,
                                data: {
                                    type: type,
                                    source: source,
                                    id: item.container0.value,
                                    label: item.container0Label.value,
                                },
                            });
                        }

                        if (item.container && !existingNodes[item.container.value]) {
                            existingNodes[item.container.value] = 1;
                            var type;
                            var color2 = color;
                            if (item.containerType && item.containerType.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#Bag") {
                                type = "container";
                                color2 = common.colorToRgba(color, opacity * 0.75);
                            } else type = "resource";

                            if (!item.containerLabel) var x = 3;
                            visjsData.nodes.push({
                                id: item.container.value,
                                label: item.containerLabel.value,
                                shadow: self.nodeShadow,
                                shape: type == "container" ? "box" : shape,
                                size: size,
                                font: type == "container" ? { color: "#fff", size: 12 } : null,
                                color: color2,
                                data: {
                                    type: type,
                                    source: source,
                                    id: item.container.value,
                                    label: item.containerLabel.value,
                                },
                            });
                        }
                        if (item.container) {
                            var edgeId = item.container0.value + "_" + "member" + "_" + item.container.value;
                            if (item.container && !existingNodes[edgeId]) {
                                existingNodes[edgeId] = 1;

                                visjsData.edges.push({
                                    id: edgeId,
                                    from: item.container0.value,
                                    to: item.container.value,
                                    //label: "<i>" + item.propertyLabel.value + "</i>",
                                    data: { from: item.container0.value, to: item.container.value, source: source },
                                    font: { multi: true, size: 10 },

                                    //  dashes: true,
                                    color: "#8528c9",
                                });
                            }
                        }

                        if (item.member && !existingNodes[item.member.value]) {
                            existingNodes[item.member.value] = 1;
                            var type;

                            if (item.memberType && item.memberType.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#Bag") {
                                type = "container";
                                color2 = common.colorToRgba(color, opacity * 0.6);
                            } else type = "resource";
                            visjsData.nodes.push({
                                id: item.member.value,
                                label: item.memberLabel.value,

                                shadow: self.nodeShadow,
                                shape: type == "container" ? "box" : shape,
                                size: size,
                                font: type == "container" ? { color: "#fff", size: 10 } : null,
                                color: color2,
                                data: {
                                    type: "container",
                                    source: source,
                                    id: item.member.value,
                                    label: item.memberLabel.value,
                                },
                            });
                        }
                        if (item.member) {
                            var edgeId = item.container.value + "_" + "member" + "_" + item.member.value;
                            if (item.member && !existingNodes[edgeId]) {
                                existingNodes[edgeId] = 1;

                                visjsData.edges.push({
                                    id: edgeId,
                                    from: item.container.value,
                                    to: item.member.value,
                                    //label: "<i>" + item.propertyLabel.value + "</i>",
                                    data: {
                                        from: item.container.value,
                                        to: item.member.value,
                                        source: source,
                                    },
                                    font: { multi: true, size: 10 },

                                    //  dashes: true,
                                    color: "#8528c9",
                                });
                            }
                        }
                    });
                    if (!visjsGraph.data || !visjsGraph.data.nodes) {
                        Lineage_classes.drawNewGraph(visjsData);
                    } else {
                        visjsGraph.data.nodes.add(visjsData.nodes);
                        visjsGraph.data.edges.add(visjsData.edges);
                    }
                    visjsGraph.network.fit();
                    $("#waitImg").css("display", "none");
                    if (objectProperties.length > 0) {
                        source = Lineage_sources.activeSource;
                        var options = {
                            filter: Sparql_common.setFilter("prop", objectProperties),
                        };
                        options.allNodes = false;
                        Lineage_relations.drawRelations(null, null, "Properties", options);
                    }
                    return callbackSeries();
                },
            ],
            function (err) {
                return;
            }
        );
    };
    self.graphResourcesXX = function (source, containerId, options) {
        if (!options) options = {};
        var existingChildren = common.jstree.getjsTreeNodes("lineage_containers_containersJstree", true, containerId);

        var data = [];
        var descendants = [];
        var stylesMap = {};

        async.series(
            [
                //getContainers descendants type container
                function (callbackSeries) {
                    if (options.nodes) return callbackSeries();
                    options.nodes = false;
                    options.bags = true;
                    self.sparql_queries.getContainerDescendants(Lineage_sources.activeSource, containerId, options, function (err, result) {
                        if (err) return callbackSeries(err);
                        data = data.concat(result.results.bindings);
                        return callbackSeries();
                    });
                },
                //getContainers descendants type node
                function (callbackSeries) {
                    if (options.bags) return callbackSeries();
                    options.nodes = true;
                    options.bags = false;

                    self.sparql_queries.getContainerDescendants(Lineage_sources.activeSource, containerId, options, function (err, result) {
                        if (err) return callbackSeries(err);
                        data = data.concat(result.results.bindings);
                        return callbackSeries();
                    });
                },
                //get containersStyles
                function (callbackSeries) {
                    data.forEach(function (item) {
                        if (item.containerStyle) if (!stylesMap[item.container.value]) stylesMap[item.container.value] = { styleId: item.containerStyle.value };
                    });
                    var ids = Object.keys(stylesMap);
                    if (ids.length == 0) return callbackSeries();
                    Lineage_styles.init();
                    Lineage_styles.listStyles(ids, function (err, styles) {
                        if (err) return alert(err);
                        for (var containerId in stylesMap) {
                            var styleId = stylesMap[containerId];
                            var styleObj = styles[styleId];
                            if (styleObj) styleObj.id = styleId;
                            stylesMap[containerId] = styleObj;
                        }
                        return callbackSeries();
                    });
                },

                function (callbackSeries) {
                    var color = Lineage_classes.getSourceColor(source);
                    var opacity = 1.0;
                    var existingNodes = visjsGraph.getExistingIdsMap();
                    var visjsData = { nodes: [], edges: [] };
                    var objectProperties = [];
                    var container0Type = null;

                    data.forEach(function (item) {
                        container0Type = item.container0Type.value;

                        var shape = "dot";
                        var color2 = common.colorToRgba(color, opacity * 1);
                        var size = Lineage_classes.defaultShapeSize;

                        var containerStyle = stylesMap[item.container0.value];
                        if (containerStyle) {
                            shape = containerStyle.shape || shape;
                            color2 = containerStyle.color || color2;
                            size = containerStyle.size || colorsize2;
                        }

                        if (item.containerType.value == "http://www.w3.org/2002/07/owl#ObjectProperty") return objectProperties.push(item.container.value);
                        if (!existingNodes[item.container0.value]) {
                            existingNodes[item.container0.value] = 1;

                            var type = "container";

                            visjsData.nodes.push({
                                id: item.container0.value,
                                label: item.container0Label.value,
                                shadow: self.nodeShadow,
                                shape: type == "container" ? "box" : shape,
                                size: size,
                                font: type == "container" ? { color: "#eee" } : null,
                                color: color2,
                                data: {
                                    type: type,
                                    containerType: item.container0Type.value,
                                    source: source,
                                    id: item.container0.value,
                                    label: item.container0Label.value,
                                },
                            });
                        }

                        if (item.container && !existingNodes[item.container.value]) {
                            existingNodes[item.container.value] = 1;
                            var type;
                            var color2 = color;

                            if (item.containerType && item.containerType.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#Bag") {
                                type = "container";

                                color2 = common.colorToRgba(color, opacity * 0.75);
                            } else type = "resource";
                            if (!item.containerLabel) var x = 3;
                            visjsData.nodes.push({
                                id: item.container.value,
                                label: item.containerLabel.value,
                                shadow: self.nodeShadow,
                                shape: type == "container" ? "box" : shape,
                                size: size,
                                font: type == "container" ? { color: "#fff", size: 12 } : null,
                                color: color2,
                                data: {
                                    type: type,
                                    containerType: item.containerType.value,
                                    source: source,
                                    id: item.container.value,
                                    label: item.containerLabel.value,
                                    next: item.containerNext ? item.containerNext.value : null,
                                    previous: item.containerPrevious ? item.containerPrevious.value : null,
                                },
                            });
                        }
                        if (item.container) {
                            if (item.container0Type == "http://www.w3.org/1999/02/22-rdf-syntax-ns#Bag") {
                                var edgeId = item.container0.value + "_" + "member" + "_" + item.container.value;
                                if (item.container && !existingNodes[edgeId]) {
                                    existingNodes[edgeId] = 1;

                                    visjsData.edges.push({
                                        id: edgeId,
                                        from: item.container0.value,
                                        to: item.container.value,
                                        //label: "<i>" + item.propertyLabel.value + "</i>",
                                        data: { from: item.container0.value, to: item.container.value, source: source },
                                        font: { multi: true, size: 10 },

                                        //  dashes: true,
                                        color: "#8528c9",
                                    });
                                }
                            }
                        }

                        if (item.containerNext) {
                            var edgeId = item.container.value + "_" + "next" + "_" + item.containerNext.value;
                            if (item.container && !existingNodes[edgeId]) {
                                existingNodes[edgeId] = 1;

                                visjsData.edges.push({
                                    id: edgeId,
                                    from: item.container.value,
                                    to: item.containerNext.value,
                                    data: { from: item.container.value, to: item.containerNext.value, source: source, type: "next" },

                                    arrows: {
                                        to: {
                                            enabled: true,
                                            type: "solid",
                                            scaleFactor: 0.5,
                                        },
                                    },
                                    color: "#f90edd",
                                });
                            }
                        }

                        if (item.member && !existingNodes[item.member.value]) {
                            existingNodes[item.member.value] = 1;
                            var type;

                            if (item.memberType && item.memberType.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#Bag") {
                                type = "container";
                                color2 = common.colorToRgba(color, opacity * 0.6);
                            } else type = "resource";
                            visjsData.nodes.push({
                                id: item.member.value,
                                label: item.memberLabel.value,

                                shadow: self.nodeShadow,
                                shape: type == "container" ? "box" : shape,
                                size: size,
                                font: type == "container" ? { color: "#fff", size: 10 } : null,
                                color: color2,
                                data: {
                                    type: "container",
                                    containerType: item.memberType.value,
                                    source: source,
                                    id: item.member.value,
                                    label: item.memberLabel.value,
                                    next: item.memberNext ? item.memberNext.value : null,
                                    previous: item.memberPrevious ? item.memberPrevious.value : null,
                                },
                            });
                        }
                        if (item.member && !item.memberNext) {
                            var edgeId = item.container.value + "_" + "member" + "_" + item.member.value;
                            if (item.member && !existingNodes[edgeId]) {
                                existingNodes[edgeId] = 1;

                                visjsData.edges.push({
                                    id: edgeId,
                                    from: item.container.value,
                                    to: item.member.value,
                                    data: {
                                        from: item.container.value,
                                        to: item.member.value,
                                        source: source,
                                    },
                                    font: { multi: true, size: 10 },
                                    color: "#8528c9",
                                });
                            }
                        }
                        if (item.memberNext) {
                            var edgeId = item.member.value + "_" + "next" + "_" + item.memberNext.value;
                            if (!existingNodes[edgeId]) {
                                existingNodes[edgeId] = 1;

                                visjsData.edges.push({
                                    id: edgeId,
                                    from: item.member.value,
                                    to: item.memberNext.value,
                                    data: { from: item.member.value, to: item.memberNext.value, source: source, type: "next" },
                                    arrows: {
                                        to: {
                                            enabled: true,
                                            type: "solid",
                                            scaleFactor: 0.5,
                                        },
                                    },
                                    color: "#f90edd",
                                });
                            }
                        }
                    });

                    // link container0 to first list element
                    if (false && container0Type == "http://www.w3.org/1999/02/22-rdf-syntax-ns#List") {
                        visjsData.nodes.forEach(function (node, index) {
                            if (containerId == node.id) return;
                            if (!node.data.previous) {
                                visjsData.nodes[index].data.first = true;
                                var edgeId = containerId + "_" + "next" + "_" + node.id;
                                if (!existingNodes[edgeId]) {
                                    existingNodes[edgeId] = 1;

                                    visjsData.edges.push({
                                        id: edgeId,
                                        from: containerId,
                                        to: node.id,
                                        label: "1",
                                        data: { from: containerId, to: node.id, source: source, type: "next", first: true },
                                        arrows: {
                                            to: {
                                                enabled: true,
                                                type: "solid",
                                                scaleFactor: 0.5,
                                            },
                                        },
                                        color: "#f90edd",
                                    });
                                }
                            }
                        });
                    }

                    if (!visjsGraph.data || !visjsGraph.data.nodes) {
                        Lineage_classes.drawNewGraph(visjsData);
                    } else {
                        visjsGraph.data.nodes.add(visjsData.nodes);
                        visjsGraph.data.edges.add(visjsData.edges);
                    }
                    visjsGraph.network.fit();
                    $("#waitImg").css("display", "none");
                    if (objectProperties.length > 0) {
                        source = Lineage_sources.activeSource;
                        var options = {
                            filter: Sparql_common.setFilter("prop", objectProperties),
                        };
                        options.allNodes = false;
                        Lineage_relations.drawRelations(null, null, "Properties", options);
                    }
                    return callbackSeries();
                },
            ],
            function (err) {
                return;
            }
        );
    };

    self.onSelectedNodeTreeclick = function (event, obj) {
        self.currentContainer = obj.node;
        if (obj.event.button != 2) self.listContainerResources(Lineage_sources.activeSource, self.currentContainer.data.id);
    };

    self.onMoveContainer = function (data, element, helper, event) {
        var sourceNodeId = element.data.nodes[0];
        var oldParent = self.currenDraggingNodeSourceParent;
        var targetNodeAnchor = element.event.target.id;
        var newParent = targetNodeAnchor.substring(0, targetNodeAnchor.indexOf("_anchor"));

        var graphUri = Config.sources[Lineage_sources.activeSource].graphUri;
        var query =
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
            "with <" +
            graphUri +
            "> delete {<" +
            oldParent +
            "> rdfs:member <" +
            sourceNodeId +
            ">}" +
            "insert {<" +
            newParent +
            "> rdfs:member <" +
            sourceNodeId +
            ">}";

        var url = Config.sources[Lineage_sources.activeSource].sparql_server.url + "?format=json&query=";

        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: Lineage_sources.activeSource }, function (err, result) {
            if (err) {
                return callback(err);
            }
        });
    };

    self.sparql_queries = {
        getContainerDescendants: function (source, containerId, options, callback) {
            var fromStr = Sparql_common.getFromStr(source, false, true);
            var query =
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "select distinct *     " +
                fromStr +
                " WHERE { ?container0  rdf:type ?type.filter(?type in (rdf:Bag,rdf:List)) ?container0 <http://www.w3.org/2000/01/rdf-schema#member> ?container. " +
                " OPTIONAL {?container0 rdfs:label ?container0Label.}" +
                " OPTIONAL {?container rdfs:label ?containerLabel.}" +
                " OPTIONAL {?container rdfs:label ?container0Label.}" +
                " OPTIONAL {?container <http://souslesens.org/resource/vocabulary/next> ?containerNext.}";

            query += " ?container rdf:type ?containerType. ";
            if (options.bags) query += " filter( ?containerType in (rdf:Bag,rdf:List))\n";
            if (options.classes) query += "filter( ?containerType =owl:Class)\n";
            if (options.individuals) query += "   filter( ?containerType = owl:NamedIndividual)\n";
            if (options.nodes) query += " filter( ?containerType not in (rdf:Bag,rdf:List)) \n";

            if (!options.onlyChildren) {
                query += " OPTIONAL { ?container <http://www.w3.org/2000/01/rdf-schema#member>+ ?member. optional{?member rdfs:label ?memberLabel.}";
                query += " OPTIONAL {?member <http://souslesens.org/resource/vocabulary/next> ?memberNext.}";

                if (options.bags) query += "   ?member rdf:type ?memberType. filter(?memberType in (rdf:Bag,rdf:List))\n";
                if (options.classes) query += "  ?member rdf:type?memberType. filter(?memberType=owl:Class).\n";
                if (options.individuals) query += " ?member rdf:type ?memberType. filter(?memberType=owl:NamedIndividual).\n";
                if (options.nodes) query += "  ?member rdf:type ?memberType. filter( ?memberType  not in (rdf:Bag,rdf:List)) \n";
                query += "}";
            }
            if (options.filter) query += " " + options.filter;

            if (containerId) {
                var filterContainerFrom = "";
                filterContainerFrom = Sparql_common.setFilter("container0", containerId);
                query += filterContainerFrom;
            }

            query += "} limit 10000";

            var url = Config.sources[source].sparql_server.url + "?format=json&query=";

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: source }, function (err, result) {
                if (err) return callback(err);
                return callback(null, result);
            });
        },
        getContainerDescendantsXXX: function (source, containerId, options, callback) {
            var fromStr = Sparql_common.getFromStr(source, false, true);
            var query =
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "select distinct *     " +
                fromStr +
                " WHERE { ?container0  rdf:type ?container0Type.filter(?container0Type in (rdf:Bag,rdf:List)) ?container0 rdfs:member ?container. " +
                " OPTIONAL {?container0 rdfs:label ?container0Label.}" +
                " OPTIONAL {?container rdfs:label ?containerLabel.}" +
                " OPTIONAL {?container rdfs:label ?container0Label.}" +
                " OPTIONAL {?container <http://souslesens.org/resource/styles/hasStyle> ?containerStyle.}" +
                " OPTIONAL { ?container <http://souslesens.org/resource/vocabulary/next> ?containerNext.?container0  rdfs:member ?containerNext}" +
                "OPTIONAL { ?containerPrevious <http://souslesens.org/resource/vocabulary/next> ?container.?container0  rdfs:member ?containerPrevious}";

            query += " ?container rdf:type ?containerType. ";
            if (options.bags) query += " filter( ?containerType in (rdf:Bag,rdf:List))\n";
            if (options.classes) query += "filter( ?containerType =owl:Class)\n";
            if (options.individuals) query += "   filter( ?containerType = owl:NamedIndividual)\n";
            if (options.nodes) query += " filter( ?containerType not in (rdf:Bag,rdf:List)) \n";

            if (!options.onlyChildren) {
                query += " OPTIONAL { ?container <http://www.w3.org/2000/01/rdf-schema#member>+ ?member. optional{?member rdfs:label ?memberLabel.}";
                query += " OPTIONAL {?member <http://souslesens.org/resource/vocabulary/next> ?memberNext.?container  rdfs:member ?memberNext}";
                query += " OPTIONAL {?memberPrevious <http://souslesens.org/resource/vocabulary/next> ?member.?container  rdfs:member ?memberPrevious}";

                if (options.bags) query += "   ?member rdf:type ?memberType. filter(?memberType in (rdf:Bag,rdf:List))\n";
                if (options.classes) query += "  ?member rdf:type?memberType. filter(?memberType=owl:Class).\n";
                if (options.individuals) query += " ?member rdf:type ?memberType. filter(?memberType=owl:NamedIndividual).\n";
                if (options.nodes) query += "  ?member rdf:type ?memberType. filter( ?memberType  not in (rdf:Bag,rdf:List)) \n";
                query += "}";
            }
            if (options.filter) query += " " + options.filter;

            if (containerId) {
                var filterContainerFrom = "";
                filterContainerFrom = Sparql_common.setFilter("container0", containerId);
                query += filterContainerFrom;
            }

            query += "} limit 10000";

            var url = Config.sources[source].sparql_server.url + "?format=json&query=";

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: source }, function (err, result) {
                if (err) return callback(err);
                return callback(null, result);
            });
        },
    };

    self.applyContainerstyle = function (containerUrl) {};

    self.graphWhiteboardNodesContainers = function () {
        var source = Lineage_sources.activeSource;
        var fromStr = Sparql_common.getFromStr(source, false, true);

        var ids = visjsGraph.data.nodes.getIds();
        var filter = Sparql_common.setFilter("node", ids);
        var query =
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
            "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "select distinct *     " +
            fromStr +
            " WHERE {?container rdfs:member ?node.  ?container rdf:type ?type. filter (?type in(rdf:Bag,rdf:List)).  ?container rdfs:label ?containerLabel " +
            filter +
            "}";

        var url = Config.sources[source].sparql_server.url + "?format=json&query=";

        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: source }, function (err, result) {
            if (err) return alert(err);
            var existingNodes = visjsGraph.getExistingIdsMap();
            var visjsData = { nodes: [], edges: [] };

            result.results.bindings.forEach(function (item) {
                if (!existingNodes[item.container.value]) {
                    existingNodes[item.container.value] = 1;

                    var color2 = "#0067bb";
                    visjsData.nodes.push({
                        id: item.container.value,
                        label: item.containerLabel.value,
                        shadow: self.nodeShadow,
                        shape: "box",
                        size: Lineage_classes.defaultShapeSize,
                        font: { color: "#eee" },
                        color: color2,
                        data: {
                            type: "container",
                            source: Lineage_sources.activeSource,
                            id: item.container.value,
                            label: item.containerLabel.value,
                        },
                    });
                }

                var edgeId = item.container.value + "_" + "member" + "_" + item.node.value;
                if (!existingNodes[edgeId]) {
                    existingNodes[edgeId] = 1;

                    visjsData.edges.push({
                        id: edgeId,
                        from: item.container.value,
                        to: item.node.value,

                        data: { from: item.container.value, to: item.node.value, source: source },
                        font: { multi: true, size: 10 },

                        //  dashes: true,
                        color: "#8528c9",
                    });
                }
            });

            visjsGraph.data.nodes.add(visjsData.nodes);
            visjsGraph.data.edges.add(visjsData.edges);

            visjsGraph.network.fit();
            $("#waitImg").css("display", "none");
        });
    };

    return self;
})();