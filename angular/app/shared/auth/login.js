var app = angular.module('torvals');

app.controller('LoginController', function($http, $state, $mdDialog, $localStorage, baseUrl, Auth) {
    var getUserInfo, signin, vm;
    vm = this;

    vm.signin = function() {
        Auth.save(
            vm.user,
            function(response){
                $localStorage.token = response.token;
                return $state.go('admin');
            },
            function(error){
                return $mdDialog.show(
                    $mdDialog.alert().title('Email o password son incorrectas.').ok('OK')
                );
            }
        );
    };

    vm.error = false;
    return vm;
});
