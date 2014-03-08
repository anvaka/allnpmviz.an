module.exports = require('an').controller(

['$scope', '$http', function AppController($scope, $http) {
  $scope.initialized = false;

  $http.get('/data/npmgraph.json').then(function (res) {
    var graphController = require('./graphController.js')(res.data);
    graphController.on('mouseEnterNode', onMouseEnter);
    graphController.on('mouseLeaveNode', onMouseLeave);
    $scope.initialized = true;
  });

  $scope.highlightPackages = function () {};

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
