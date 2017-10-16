var app = angular.module('torvals');

app.controller('ServerController', function(Server) {
    var vm = this;

    Server.query({}, function(servers){
        vm.servers = servers;
    });

    return vm;
})
.controller('ServerDetailController', function(Server, $stateParams){
    var vm = this;
    
    Server.get({id: $stateParams.server_id}, function(server){
        vm.server = server;
    });

    vm.envs = [{'id': 1, 'name': 'testing'}];

    return vm;
});
