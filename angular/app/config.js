angular.module('torvals').config([
    '$stateProvider',
    '$urlRouterProvider',
    '$contentProvider',
    '$httpProvider',
    '$logProvider',
    '$locationProvider',
    'toastrConfig',
    '$mdThemingProvider',
    '$breadcrumbProvider',
    function(
        $stateProvider,
        $urlRouterProvider,
        $contentProvider,
        $httpProvider,
        $logProvider,
        $locationProvider,
        toastrConfig,
        $mdThemingProvider,
        $breadcrumbProvider,
    ) {
    // Configure content base url.
    $contentProvider.urlPrefix = staticUrl;

    // Toastr configurations.
    $logProvider.debugEnabled(true);
    toastrConfig.allowHtml = true;
    toastrConfig.timeOut = 3000;
    toastrConfig.positionClass = 'toast-top-right';
    toastrConfig.progressBar = true;
    toastrConfig.templates = {
      toast: $contentProvider.url('app/shared/directives/toast.html'),
      progressbar : $contentProvider.url('app/shared/directives/progressbar.html')
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
      templateUrl: $contentProvider.url('app/shared/partials/breadcrumb.html')
    });

    // States.
    $stateProvider.state('public', {
      url: '/',
      abstract: true,
      views: {
        "header": {
          templateUrl: $contentProvider.url('app/shared/partials/public-header.html'),
        }
      }
    })
    .state('public.login', {
      url: '',
      views: {
        "content@": {
        templateUrl: $contentProvider.url('app/shared/auth/login.html'),
        controller: 'LoginController',
        controllerAs: 'login'
        }
      }
    })
    .state('admin', {
      url: '/home',
      ncyBreadcrumb: {
        skip: true
      },
      views: {
        "header": {
            templateUrl: $contentProvider.url('app/shared/home/partials/header.html'),
            controller: 'HeaderController',
            controllerAs: 'h',
            resolve: {}
        },
        "content": {
            templateUrl: $contentProvider.url('app/shared/home/partials/home.html')
        },
        "sidebar": {
            templateUrl: $contentProvider.url('app/shared/home/partials/sidebar.html')
        },
        "footer": {
            templateUrl: $contentProvider.url('app/shared/home/partials/footer.html')
        }
      }
    })
   .state('admin.servers', {
      url: '/servers',
      ncyBreadcrumb: {
        label: 'Servers /'
      },
      views: {
        "content@": {
            templateUrl: $contentProvider.url('app/components/servers/partials/server-list.html'),
            controller: 'ServerController',
            controllerAs: 'server'
        }
      }
    })
    .state('admin.servers.detail', {
        url: '/:server_id/detail',
        ncyBreadcrumb: {
            label: 'Server /'
        },
        views: {
            "content@": {
                templateUrl: $contentProvider.url('app/components/servers/partials/server-detail.html'),
                controller: 'ServerDetailController',
                controllerAs: 'server'
            }
        }
    });

    return $urlRouterProvider.otherwise('/');
}]);
