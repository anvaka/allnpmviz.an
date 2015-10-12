require('./scroll/whenScrolled');

module.exports = require('an').controller(

// todo: refactor this. It's too big, violates srp
['$scope', '$http', function AppController($scope, $http) {
  $scope.initialized = false;
  var graphController;
  var page = require('./scroll/page');
  var graph = Viva.Graph.graph();

  $http.get('data/positions.bin', {
      responseType: 'arraybuffer'
    })
    .then(convertToPositions)
    .then(addNodesToGraph)
    .then(downloadLinks)
    .then(downloadLabels)
    .then(function () {
      graphController = require('./graphController.js')(graph);
      graphController.on('mouseEnterNode', onMouseEnter);
      graphController.on('mouseLeaveNode', onMouseLeave);
      $scope.initialized = true;
    });

  function addNodesToGraph(positions) {
    positions.forEach(function(pos, idx) {
      addToGraph(idx, 'pos', pos);
    });
  }

  function addToGraph(nodeId, dataName, dataValue) {
    var node = graph.getNode(nodeId);
    if (!node) {
      var data = {};
      data[dataName] = dataValue;
      graph.addNode(nodeId, data);
    } else {
      node.data[dataName] = dataValue;
    }
  }

  function convertToPositions(response) {
    var data = new Int32Array(response.data);
    var positions = [];

    for (var i = 0; i < data.length; i += 2) {
      var pos = {
        x: data[i],
        y: data[i + 1]
      };
      positions.push(pos);
    }

    return positions;
  }

  function downloadLinks() {
    return $http.get('data/links.bin', {
      responseType: "arraybuffer"
    }).then(addLinksToGraph)
  }

  function downloadLabels() {
    return $http.get('data/labels.json')
      .then(addLabelsToGraph);
  }

  function addLinksToGraph(res) {
    var arr = new Int32Array(res.data);
    var lastFromId;
    for (var i = 0; i < arr.length; i++) {
      var id = arr[i];
      if (id < 0) {
        lastFromId = -id - 1;
      } else {
        graph.addLink(lastFromId, id - 1);
      }
    }

    return graph;
  }

  function addLabelsToGraph(response) {
    labels = response.data;
    labels.forEach(function(label, idx) {
      addToGraph(idx, 'label', label);
    });
  }

  $scope.highlightPackages = function () {
    var searchTerm = $scope.search,
        rNameMatch = new RegExp(searchTerm, 'ig'),
        rExactMatch = new RegExp('^' + searchTerm + '$', 'ig');

    var allMatches = graphController.highlightRules(function (node) {
      if (searchTerm && node.data.label.match(rExactMatch)) {
        return 0xE28100ff;
      } else if (searchTerm && node.data.label.match(rNameMatch)) {
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
      $scope.name = node.data.label;
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
