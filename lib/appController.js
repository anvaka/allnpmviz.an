module.exports = require('an').controller(

['$scope', '$http', function AppController($scope, $http) {
  $scope.initialized = false;
  var graphController;

  $http.get('/data/npmgraph.json').then(function (res) {
    graphController = require('./graphController.js')(res.data);
    graphController.on('mouseEnterNode', onMouseEnter);
    graphController.on('mouseLeaveNode', onMouseLeave);
    $scope.initialized = true;
  });

  $scope.highlightPackages = function () {
    var searchTerm = $scope.search,
        rNameMatch = new RegExp(searchTerm, 'ig'),
        rExactMatch = new RegExp('^' + searchTerm + '$', 'ig');

    var found = graphController.highlightRules(function (node) {
      if (searchTerm && node.id.match(rExactMatch)) {
        return 0xE28100ff;
      } else if (searchTerm && node.id.match(rNameMatch)) {
        return 0xD61D73ff;
      }
    });
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
