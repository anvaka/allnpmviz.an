/**
 * Creates constant layout for a graph
 */
module.exports = function (graph) {
  var layout = Viva.Graph.Layout.constant(graph);
  layout.placeNode(function (node) {
    if (!node.data.pos) { console.log(node.data); return {x: 0, y: 0};}
    return node.data.pos;
  });

  return layout;
};
