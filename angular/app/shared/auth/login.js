var app = angular.module('torvals');


app.controller('LoginController', function($http, $state, $mdDialog, $localStorage) {

    var getUserInfo, loginError, signin, vm;
    vm = this;
    delete $localStorage.token;
    delete $localStorage.profileInfo;
    delete $localStorage.placeInfo;
    delete $localStorage.userId;

    loginError = $mdDialog.alert().title('El usuario o contraseña son incorrectas.').ok('OK');
    /*
     * getUserInfo = function(next) {
     *     return Resources.user.profile().then(function(response) {
     *             var profileInfo;
     *             profileInfo = response.data;
     *             $localStorage.profileInfo = profileInfo;
     *             return next();
     *     });
     * };
     */

    vm.signin = function() {
        /*
         * return EndPointService.signin(vm.user, function(res) {
         *     if (res.type === false) {
         *         return vm.error = true;
         *     } else {
         *         Resources.user.profile().then(function(res){
         *                 $localStorage.userId = res.data.id;
         *         });
         *         $localStorage.token = res.token;
         *         return getUserInfo(function() {
         *             return $state.go('public.selectPlace');
         *         });
         *     }
         * }, function() {
         *         return $mdDialog.show(loginError);
         * });
         */
    };

    vm.error = false;
    return vm;
});
