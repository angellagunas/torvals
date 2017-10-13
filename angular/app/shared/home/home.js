angular.module('torvals').controller('HeaderController', function($state, GlobalService, $mdSidenav, $scope, $timeout) {
    'ngInject';
    var buildDelayedToggler, debounce, logout, vm;
    vm = this;
    debounce = function(func, wait, context) {
        var timer;
        timer = void 0;
        return function() {
            var args;
            context = $scope;
            args = Array.prototype.slice.call(arguments);
            $timeout.cancel(timer);
            timer = $timeout((function() {
                timer = void 0;
                func.apply(context, args);
            }), wait || 10);
        };
    };

    buildDelayedToggler = function(navID) {
        return debounce((function() {
            return $mdSidenav(navID).toggle();
        }), 200);
    };

    $scope.toggleSidebar = buildDelayedToggler('left');

    logout = function() {
        return Global.logout();
    };

    vm.logout = logout;
});
