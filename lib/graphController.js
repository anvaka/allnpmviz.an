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

  events.mouseEnter(function (node) {
    ui.handleHover(node, true);
    api.fire('mouseEnterNode', node);
    renderer.rerender();
  }).mouseLeave(function (node) {
    ui.handleHover(node, false);
    api.fire('mouseLeaveNode', node);
    renderer.rerender();
  });

  return api;
};
