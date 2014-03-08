var nodeColor = 0x009ee8ff;
var linkColor = 0xb3b3b3ff;

module.exports = function (graph) {
  var graphics = Viva.Graph.View.webglGraphics();
  var lastHovered;

  graphics.node(function (node) {
    var img = Viva.Graph.View.webglSquare(10, nodeColor);
    return img;
  }).link(function (link) {
    var line = Viva.Graph.View.webglLine(linkColor);
    line.oldColor = linkColor;
    return line;
  });

  return {
    graphics: graphics,
    handleHover: onHover,
    highlight: highlight
  };

  function highlight(node, color) {
    var nodeUI = graphics.getNodeUI(node.id);
    if (color !== undefined) {
      if (color.size) {
        nodeUI.size = color.size;
        nodeUI.color = color.color;
      } else {
        nodeUI.size = 100;
        nodeUI.color = color;
      }
    } else {
      nodeUI.size = 10;
      nodeUI.color = nodeColor;
    }
  }

  function onHover(node, isHover) {
    if (isHover) {
      colorLinks(lastHovered);
      lastHovered = node;

      graph.forEachLinkedNode(node.id, function (node, link) {
          var linkUI = graphics.getLinkUI(link.id);
          linkUI.color = 0xff0000ff;
          graphics.bringLinkToFront(linkUI);
      });
    } else {
      colorLinks(lastHovered);
      lastHovered = null;

      colorLinks(node);
    }
  }


  function colorLinks (node, color) {
    if (node && node.id) {
      graph.forEachLinkedNode(node.id, function (node, link) {
          var linkUI = graphics.getLinkUI(link.id);
          linkUI.color = color || linkUI.oldColor;
      });
    }
  }
};
