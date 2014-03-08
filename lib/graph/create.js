/**
 * Transforms graph data produced by `allnpm` module into a graph
 */
module.exports = function (graphData) {
  var graph = Viva.Graph.graph();

  graphData.forEach(function (node, idx) {
    graph.addNode(node.id, node);
  });

  graphData.forEach(function (node) {
    var dependencies = node.d;
    if (dependencies) {
      for (var i = 0; i < dependencies.length; ++i) {
        var linkId = dependencies[i];
        var otherNode = graphData[linkId].id;

        graph.addLink(node.id, otherNode);
      }
    }
  });

  return graph;
};
