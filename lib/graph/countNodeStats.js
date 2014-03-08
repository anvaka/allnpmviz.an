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
