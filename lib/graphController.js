module.exports = function (graphData) {
  var graph = require('./graph/create')(graphData);
  var layout = require('./graph/layout')(graph);
  var ui = require('./graph/ui')(graph);
  var api = require('ngraph.events')({});
  var graphics = ui.graphics;

  var events = Viva.Graph.webglInputEvents(graphics, graph);
  var renderer = Viva.Graph.View.renderer(graph, {
     layout     : layout, // use our custom 'constant' layout
     graphics   : graphics,
     container: document.querySelector('.graphView')
  });

  renderer.run();

  for (var i = 0; i < 25; ++i) {
    renderer.zoomOut();
  }

  setTimeout(function () {
    renderer.rerender();
  });
  window.g = graph; // expose it for console analysis

  events.mouseEnter(function (node) {
    ui.handleHover(node, true);
    api.fire('mouseEnterNode', node);
    renderer.rerender();
  }).mouseLeave(function (node) {
    ui.handleHover(node, false);
    api.fire('mouseLeaveNode', node);
    renderer.rerender();
  });

  api.highlightRules = function (rulePredicate) {
    var highlighted = [];

    graph.forEachNode(function(node) {
      var color = rulePredicate(node);
      ui.highlight(node, color);
      if (color !== undefined) {
        highlighted.push(node);
      }
    });

    renderer.rerender();
    return highlighted;
  };

  return api;
};
