;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./lib/appController');

var allnpm = angular.module('allnpm', []);

require('an').flush(allnpm);

angular.bootstrap(document, [allnpm.name]);

},{"./lib/appController":2,"an":10}],2:[function(require,module,exports){
require('./scroll/whenScrolled');

module.exports = require('an').controller(

// todo: refactor this. It's too big, violates srp
['$scope', '$http', function AppController($scope, $http) {
  $scope.initialized = false;
  var graphController;
  var page = require('./scroll/page');

  var nodeIdxToNodeId = {};
  $http.get('data/npmgraph.json').then(function (res) {
    res.data.forEach(function (node, idx) {
      nodeIdxToNodeId[idx] = node.id;
    });
    graphController = require('./graphController.js')(res.data);
    graphController.on('mouseEnterNode', onMouseEnter);
    graphController.on('mouseLeaveNode', onMouseLeave);
    $scope.initialized = true;
  });

  var testData;
  $scope.toggleTests = function () {
    if (!testData) {
      $http.get('data/withtests.json').then(function (res) {
        testData = transformToTestData(res.data);
        toggleTests($scope.showTests);
      });
    } else {
      toggleTests($scope.showTests);
    }
  };

  function toggleTests(show) {
    var allMatches = graphController.highlightRules(function (node) {
      if (show && testData[node.id]) {
        return {
          size: 10,
          color: 0xFF4500ff
        };
      }
    });
    showInSearch(allMatches);
  }

  function transformToTestData(data) {
    var nodeIdHasTest = {};
    for (var i = 0; i < data.length; ++i) {
      nodeIdHasTest[nodeIdxToNodeId[data[i]]] = true;
    }

    return nodeIdHasTest;
  }

  $scope.highlightPackages = function () {
    var searchTerm = $scope.search,
        rNameMatch = new RegExp(searchTerm, 'ig'),
        rExactMatch = new RegExp('^' + searchTerm + '$', 'ig');

    var allMatches = graphController.highlightRules(function (node) {
      if (searchTerm && node.id.match(rExactMatch)) {
        return 0xE28100ff;
      } else if (searchTerm && node.id.match(rNameMatch)) {
        return 0xD61D73ff;
      }
    });

    showInSearch(allMatches);
  };

  function showInSearch(allMatches) {
    allMatches = allMatches.map(function (match) { return match.id; });
    $scope.totalFound = allMatches.length;
    $scope.searchResults = null;
    var pageResults = page(allMatches, function (currentPage) {
      if (!$scope.searchResults) {
        $scope.searchResults = [];
      }
      $scope.searchResults = $scope.searchResults.concat(currentPage);
    });
    $scope.loadMore = pageResults.loadMore;
    $scope.loadMore();
  }

  $scope.loadMore = function() {
    var totalItems = allSearchResults.length; 
    if (totalItems === 0) return;

    var from = itemsPerPage * lastPage;
    var to = Math.min((lastPage + 1) * itemsPerPage, totalItems);
    if (to - from <= 0) return;

    if (!$scope.searchResults) {
      $scope.searchResults = [];
    }
    $scope.searchResults = $scope.searchResults.concat(allSearchResults.slice(from, to));
    lastPage += 1;
  };

  var countNodeStats = require('./graph/countNodeStats');
  function onMouseEnter(node) {
    $scope.$apply(function () {
      $scope.name = node.id;
      $scope.author = node.data.a || '';
      $scope.license = node.data.l || '';
      $scope.stats = countNodeStats(node.id, node.links);
    });
  }

  function onMouseLeave(node) {
    $scope.$apply(function () {
      $scope.node = null;
    });
  }
}]
);

},{"./graph/countNodeStats":3,"./graphController.js":7,"./scroll/page":8,"./scroll/whenScrolled":9,"an":10}],3:[function(require,module,exports){
/**
 * Counts number of dependencies/dependents for a give node
 */
module.exports = function countStats(nodeId, links) {
  var dependencies = 0; dependents = 0;
  if (links) {
    for (var i = 0; i < links.length; ++i) {
      if (links[i].fromId === nodeId) {
        dependencies += 1;
      } else {
        dependents += 1;
      }
    }
  }

  return {
    dependencies: dependencies,
    dependents: dependents
  };
};

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"./graph/create":4,"./graph/layout":5,"./graph/ui":6,"ngraph.events":15}],8:[function(require,module,exports){
module.exports = function (collection, foundCb, itemsPerPage) {
  collection = collection || [];
  itemsPerPage = itemsPerPage || 20;
  lastPage = 0;

  return {
    loadMore : function () {
      var totalItems = collection.length;
      if (totalItems === 0) return;

      var from = itemsPerPage * lastPage;
      var to = Math.min((lastPage + 1) * itemsPerPage, totalItems);
      if (to - from <= 0) return;

      foundCb(collection.slice(from, to));
      lastPage += 1;
    }
  };
};

},{}],9:[function(require,module,exports){
module.exports = require('an').directive(whenScrolled);

function whenScrolled() {
  return function(scope, elm, attr) {
    var raw = elm[0];
    elm.bind('scroll', function() {
      if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
        scope.$apply(attr.whenScrolled);
      }
    });
  };
}

},{"an":10}],10:[function(require,module,exports){
var directive = require('./lib/directive');
var controller = require('./lib/controller');
var filter = require('./lib/filter');

module.exports = {
  directive: directive.register,
  controller: controller.register,
  filter: filter.register,

  flush: function (module) {
    if (!module) {
      module = createModule();
    }

    controller.flush(module);
    directive.flush(module);
    filter.flush(module);

    return module;
  }
};

function createModule() {
  return angular.module('anModule', []);
}

},{"./lib/controller":11,"./lib/directive":12,"./lib/filter":13}],11:[function(require,module,exports){
var registered = {};

exports.register = function (ctrl, name) {
  name = name || require('./functionName')(ctrl);
  if (!name) {
    throw new Error('Anonymous functions cannot be registered as controllers. Please provide named function or pass second argument as controlelr name');
  }

  registered[name] = ctrl;

  return ctrl;
};

exports.flush = function (ngModule) {
  Object.keys(registered).forEach(function (ctrlName) {
    ngModule.controller(ctrlName, registered[ctrlName]);
  });
};

},{"./functionName":14}],12:[function(require,module,exports){
var registered = {};

exports.register = function (directive, name) {
  name = name || require('./functionName')(directive);
  if (!name) {
    throw new Error('Anonymous functions cannot be registered as directives. Please provide named function or pass second argument as directive name');
  }

  registered[name] = directive;

  return directive;
};

exports.flush = function (ngModule) {
  Object.keys(registered).forEach(function (dirName) {
    ngModule.directive(dirName, registered[dirName]);
  });
};

},{"./functionName":14}],13:[function(require,module,exports){
var registered = {};

exports.register = function (filter, name) {
  name = name || require('./functionName')(filter);
  if (!name) {
    throw new Error('Anonymous functions cannot be registered as filters. Please provide named function or pass second argument as filter name');
  }

  registered[name] = filter;

  return filter;
};

exports.flush = function (ngModule) {
  Object.keys(registered).forEach(function (filterName) {
    ngModule.filter(filterName, registered[filterName]);
  });
};

},{"./functionName":14}],14:[function(require,module,exports){
module.exports = function (fun) {
  var funBody = fun.toString();
  var nameMatch = funBody.match(/function\s+(\w+)/);
  return nameMatch && nameMatch[1];
};

},{}],15:[function(require,module,exports){
module.exports = function(subject) {
  validateSubject(subject);

  var eventsStorage = createEventsStorage(subject);
  subject.on = eventsStorage.on;
  subject.off = eventsStorage.off;
  subject.fire = eventsStorage.fire;
  return subject;
};

function createEventsStorage(subject) {
  // Store all event listeners to this hash. Key is event name, value is array
  // of callback records.
  //
  // A callback record consists of callback function and its optional context:
  // { 'eventName' => [{callback: function, ctx: object}] }
  var registeredEvents = {};

  return {
    on: function (eventName, callback, ctx) {
      if (typeof callback !== 'function') {
        throw new Error('callback is expected to be a function');
      }
      if (!registeredEvents.hasOwnProperty(eventName)) {
        registeredEvents[eventName] = [];
      }
      registeredEvents[eventName].push({callback: callback, ctx: ctx});

      return subject;
    },

    off: function (eventName, callback) {
      var wantToRemoveAll = (typeof eventName === 'undefined');
      if (wantToRemoveAll) {
        // Killing old events storage should be enough in this case:
        registeredEvents = {};
        return subject;
      }

      if (registeredEvents.hasOwnProperty(eventName)) {
        var deleteAllCallbacksForEvent = (typeof callback !== 'function');
        if (deleteAllCallbacksForEvent) {
          delete registeredEvents[eventName];
        } else {
          var callbacks = registeredEvents[eventName];
          for (var i = 0; i < callbacks.length; ++i) {
            if (callbacks[i].callback === callback) {
              callbacks.splice(i, 1);
            }
          }
        }
      }

      return subject;
    },

    fire: function (eventName) {
      var noEventsToFire = !registeredEvents.hasOwnProperty(eventName);
      if (noEventsToFire) {
        return subject; 
      }

      var callbacks = registeredEvents[eventName];
      var fireArguments;
      if (arguments.length > 1) {
        fireArguments = Array.prototype.splice.call(arguments, 1);
      }
      for(var i = 0; i < callbacks.length; ++i) {
        var callbackInfo = callbacks[i];
        callbackInfo.callback.apply(callbackInfo.ctx, fireArguments);
      }

      return subject;
    }
  };
}

function validateSubject(subject) {
  if (!subject) {
    throw new Error('Eventify cannot use falsy object as events subject');
  }
  var reservedWords = ['on', 'fire', 'off'];
  for (var i = 0; i < reservedWords.length; ++i) {
    if (subject.hasOwnProperty(reservedWords[i])) {
      throw new Error("Subject cannot be eventified, since it already has property '" + reservedWords[i] + "'");
    }
  }
}

},{}]},{},[1])
;