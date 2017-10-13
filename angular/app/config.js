angular.module('torvals').config([
  '$stateProvider', '$urlRouterProvider', '$contentProvider', '$httpProvider', '$logProvider', '$locationProvider', 'toastrConfig', '$mdThemingProvider', '$breadcrumbProvider',
  function($stateProvider, $urlRouterProvider, $contentProvider, $httpProvider, $logProvider, $locationProvider, toastrConfig, $mdThemingProvider, $breadcrumbProvider) {
    // Configure content base url.
    $contentProvider.urlPrefix = staticUrl;

    // Toastr configurations.
    $logProvider.debugEnabled(true);
    toastrConfig.allowHtml = true;
    toastrConfig.timeOut = 3000;
    toastrConfig.positionClass = 'toast-top-right';
    toastrConfig.progressBar = true;
    toastrConfig.templates = {
      toast: $contentProvider.url('static/app/shared/directives/toast.html'),
      progressbar : $contentProvider.url('static/app/shared/directives/progressbar.html')
    };

    // Theme configurations.
    $mdThemingProvider.theme('default').primaryPalette('amber').accentPalette('amber');

    // Token interceptor.
    $httpProvider.interceptors.push(function($q, $localStorage, $rootScope) {
      return {
        request: function(config) {
        config.headers = config.headers || {};
        if ($localStorage.token) {
          config.headers.Authorization = 'JWT ' + $localStorage.token;
        }
        return config;
        },
        responseError: function(response) {
        if (response.status === 401 || response.status === 403) {
          $rootScope.$emit("unauthorized");
        }
        return $q.reject(response);
        }
      };
    });

    // Breadcrumb configurations.
    $breadcrumbProvider.setOptions({
      templateUrl: $contentProvider.url('views/admin/components/breadcrumb/breadcrumb.html')
    });

    // States.
    $stateProvider.state('public', {
      url: '/',
      abstract: true,
      views: {
        "header": {
          templateUrl: $contentProvider.url('static/app/shared/public-header.html'),
        }
      }
    }).state('public.login', {
      url: '',
      views: {
        "content@": {
        templateUrl: $contentProvider.url('static/app/shared/auth/login.html'),
        controller: 'LoginController',
        controllerAs: 'login'
        }
      }
    });

    return $urlRouterProvider.otherwise('/');
}]);
