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
