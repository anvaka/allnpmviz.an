var test = require('tap').test;
var countNodeStats = require('../lib/graph/countNodeStats');

test('Can count node dependencies', function (t) {
  var stats = countNodeStats(1, [{fromId: 1, toId: 2}]);
  t.equal(stats.dependencies, 1, 'should have one dependent');
  t.end();
});
