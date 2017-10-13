(function() {
    angular.module('torvals', [
        'ngAnimate',
        'ngSanitize',
        'ngMessages',
        'ngAria',
        'ngResource',
        'ui.router',
        'ngMaterial',
        'toastr',
        'ngMdIcons',
        'md.data.table',
        'ngStorage',
        'base64',
        'ngMaterialDatePicker',
        'anim-in-out',
        'ncy-angular-breadcrumb',
        'vo.content',
        'ui.router'
    ]);

}).call(this);


(function() {
  angular.module('torvals').run(["$log", "$localStorage", "$state", "$stateParams", "$rootScope", "$location", "$content", function($log, $localStorage, $state, $stateParams, $rootScope, $location, $content) {
    'ngInject';
    $rootScope.$state = $state;
    $rootScope.$content = $content;

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
  }]);

}).call(this);
