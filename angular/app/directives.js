(function() {
    angular.module('torvals')

        .directive('profileInfoSidebar', [
            '$localStorage', '$content',
            function($localStorage, $content) {
                return {
                  restrict: 'E',
                  templateUrl: $content.url('app/shared/partials/profile-sidebar.html'),
                  link: function(scope) {

                    // Placing a placeholder, when thumbnail is not given.
                    var thumbnail = 'http://placehold.it/100x100';
                    scope.profileInfo = {
                        name: 'lorem_ipsum__',
                        role: 'lorem_ipsum__',
                        thumbnail: thumbnail,
                    };

                    return scope;
                  }
                };
            }
        ])

        .directive('placeInfoSidebar', [
            '$localStorage', '$content',
            function($localStorage, $content) {
                return {
                  restrict: 'E',
                  templateUrl: $content.url('app/shared/partials/place-info-sidebar.html'),
                  link: function(scope) {
                    scope.placeInfo = {
                        name: 'lorem_ipsum__',
                    };

                    return scope;
                  }
                };
            }
        ])

        .directive('routeName', function() {
            return {
              restrict: 'E',
              template: '<span>{{name}}</span>',
              controller: ["$scope", "$rootScope", function($scope, $rootScope) {
                var currentState, setStateNameHeader;
                setStateNameHeader = function(state) {
                  switch (state) {
                    case 'admin.events':
                      return $scope.name = 'Lista de eventos';
                    case 'admin.events.new':
                      return $scope.name = 'Nuevo evento';
                    case 'admin.events.requested':
                      return $scope.name = 'Lista de solicitudes';
                    case 'admin.events.edit':
                      return $scope.name = 'Editar evento';
                    case 'admin.rooms':
                      return $scope.name = 'Lista de salas';
                    case 'admin.rooms.new':
                      return $scope.name = 'Nueva sala';
                    case 'admin.rooms.edit':
                      return $scope.name = 'Editar sala';
                    case 'admin.rooms.log':
                      return $scope.name = 'Histórico de sala';
                    case 'admin.areas':
                      return $scope.name = 'Lista de Áreas';
                    case 'admin.areas.new':
                      return $scope.name = 'Nueva Área';
                    case 'admin.areas.edit':
                      return $scope.name = 'Editar Área';
                    case 'admin.areas.log':
                      return $scope.name = 'Histórico de eventos';
                    case 'admin.tablets':
                      return $scope.name = 'Lista de tabletas';
                    case 'admin.tablets.edit':
                      return $scope.name = 'Editar tableta';
                    case 'admin.wearables':
                      return $scope.name = 'Lista de wearables';
                    case 'admin.wearables.new':
                      return $scope.name = 'Nuevo wearable';
                    case 'admin.wearables.edit':
                      return $scope.name = 'Editar wearable';
                    case 'admin.users':
                      return $scope.name = 'Lista de usuarios';
                    case 'admin.users.new':
                      return $scope.name = 'Nuevo usuario';
                    case 'admin.users.edit':
                      return $scope.name = 'Editar usuario';
                    case 'admin.network':
                      return $scope.name = 'Red';
                    case 'admin.profile':
                      return $scope.name = 'Editar perfil';
                    case 'admin.reports':
                      return $scope.name = 'Generar reporte';
                    default:
                      return $scope.name = ':/';
                  }
                };
                currentState = $rootScope.$state.current.name;
                setStateNameHeader(currentState);
                return $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
                  var state;
                  state = toState.name;
                  return setStateNameHeader(state);
                });
              }]
            };
        })

        .directive('passwordMatch', function() {
            var directive, linkFunc;
            linkFunc = function(scope, elem, attrs, ctrl) {
              var firstPassword;
              firstPassword = "." + attrs.passwordMatch;
              elem.add(firstPassword).on('keyup', function() {
                return scope.$apply(function() {
                  var v;
                  v = elem.val() === $(firstPassword).val();
                  return ctrl.$setValidity('pwmatch', v);
                });
              });
            };
            return directive = {
              require: 'ngModel',
              link: linkFunc
            };
        })

        .directive('fileUpload', ["$parse", function($parse) {
            var directive, linkFunc;
            linkFunc = function(scope, element, attrs) {
                var onChangeHandler = scope.$eval(attrs.fileUpload);
                element.bind('change', onChangeHandler);
            };
            return directive = {
              restrict: 'A',
              link: linkFunc
            };
        }])

        .directive('file', ["$parse", "$rootScope", function($parse, $rootScope) {
            var link;
            link = function(scope, element, attrs) {
              return element.bind('change', function(event) {
                var file;
                file = event.target.files[0];
                scope.file = file != null ? file : {
                  file: void 0
                };
                return scope.$apply();
              });
            };
            return {
              link: link,
              scope: {
                file: '='
              }
            };
        }]);
}).call(this);
