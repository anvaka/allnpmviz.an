require('./lib/appController');

var allnpm = angular.module('allnpm', []);

require('an').flush(allnpm);

angular.bootstrap(document, [allnpm.name]);
