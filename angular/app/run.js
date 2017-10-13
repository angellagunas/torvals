angular.module('torvals').run(function($log, $localStorage, $state, $stateParams, $rootScope, $location) {
  'ngInject';
  $rootScope.$state = $state;
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    var state;
    state = toState.name.split('.')[0];
    if (state === "admin" && typeof $localStorage.token === "undefined") {
      return $state.go('login');
    } else if (toState.name === 'login' && typeof $localStorage.token !== "undefined") {
      return $state.go('admin');
    }
  });
  return $rootScope.$on('unauthorized', function() {
    return $state.go('public.login');
  });
});
