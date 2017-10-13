angular.module('torvals')
    .factory('Customer', [
        '$resource',
        function ($resource) {
            return $resource(
                '/api/v1/customers/:id',
                {
                    id: '@id'
                },
                {
                    'update': { method: 'patch' }
                }
            );
        }
    ]);
  /*
   *   .service('EndPointService', ["$http", "$state", "$localStorage", "$base64", "baseUrl", function($http, $state, $localStorage, $base64, baseUrl) {
   *       'ngInject';
   *       var addRooms, addWearable, changerUser, editRooms, editWearables, getRoomId, getRooms, getUserFromToken, getUsers, getWearableId, getWearables, logout, removeRooms, removeWearables, resetPassword, sendEmailForgetPass, signin;
   *       this.baseUrl = baseUrl;
   *       changerUser = function() {
   *         return angular.extend(currentUser, user);
   *       };
   *       getUserFromToken = function() {
   *         var encoded, token, user;
   *         token = $localStorage.token;
   *         user = {};
   *         if (typeof token !== 'undefined') {
   *           encoded = token.split('.')[1];
   *           user = JSON.parse($base64.decode(endoded));
   *         }
   *         return user;
   *       };
   *       signin = function(data, success, error) {
   *           $http.post(this.baseUrl + 'auth/admins/login', data).success(success).error(error);
   *       };
   *       logout = function() {
   *         delete $localStorage.token;
   *         delete $localStorage.profileInfo;
   *         delete $localStorage.placeInfo;
   *         delete $localStorage.userId;
   *         $state.go('public.login');
   *       };
   *       sendEmailForgetPass = function(data, success, error) {
   *         return $http.post(this.baseUrl + "auth/new-password", data).success(success).error(error);
   *       };
   *       resetPassword = function(data, success, error) {
   *         var send;
   *         send = {
   *           password: data.password,
   *           token: data.token
   *         };
   *         return $http.post(this.baseUrl + "auth/change-password", send).success(success).error(error);
   *       };
   *       getLoggedUser = function(){
   *           var localUser = localStorageService.get(USERKEY);
   *           if (localUser) {
   *               return localUser;
   *           }
   *           return null;
   *       };
   *       getUsers = function(success, error) {
   *         return $http.get(this.baseUrl + 'users').success(success).error(error);
   *       };
   *       getRoomId = function(roomId) {
   *         return $http.get(this.baseUrl + "rooms/" + roomId);
   *       };
   *       getRooms = function(success, error) {
   *         var customer = $localStorage.placeInfo.region.zone.country.customer.id,
   *               country = $localStorage.placeInfo.region.zone.country.id,
   *               zone = $localStorage.placeInfo.region.zone.id,
   *               region = $localStorage.placeInfo.region.id,
   *               place = $localStorage.placeInfo.id,
   *               uri = "customers/"+customer+"/countries/"+country+"/zones/"+zone+"/regions/"+region+"/places/"+place+"/rooms";

   *         return $http.get(this.baseUrl + uri).success(success).error(error);
   *       };
   *       addRooms = function(data, success, error) {
   *         return $http.post(this.baseUrl + 'rooms', data).success(success).error(error);
   *       };
   *       removeRooms = function(roomId, success, error) {
   *         return $http["delete"](this.baseUrl + "rooms/" + roomId);
   *       };
   *       editRooms = function(data) {
   *         return $http.patch(this.baseUrl + "rooms/" + data.id, data);
   *       };
   *       getWearableId = function(wearableId) {
   *         var queryParams = {
   *             "type": "wearable"
   *         };
   *         var url = this.baseUrl + "devices/" + wearableId;
   *         return $http.get(url, {params: queryParams});
   *       };
   *       getWearables = function(success, error) {
   *         var queryParams = {
   *             "type": "wearable",
   *             "placeid": $localStorage.placeInfo.id
   *         };
   *         var url = this.baseUrl + 'devices';
   *         return $http.get(url, {params: queryParams}).success(success).error(error);
   *       };
   *       addWearable = function(data, success, error) {
   *         var queryParams = {
   *             "type": "wearable"
   *         };
   *         var url = this.baseUrl + 'devices';
   *         return $http.post(url, {params: queryParams}, data).success(success).error(error);
   *       };
   *       removeWearables = function(wearableId, success, error) {
   *         var queryParams = {
   *             "type": "wearable"
   *         };
   *         var url = this.baseUrl + 'devices/' + wearableId;
   *         return $http["delete"](url, {params: queryParams}).success(success).error(error);
   *       };
   *       editWearables = function(data) {
   *         var queryParams = {
   *             "type": "wearable"
   *         };
   *         var url = this.baseUrl + "devices/" + data.id;
   *         return $http.patch(url, data, {params: queryParams});
   *       };
   *       this.logout = logout;
   *       this.signin = signin;
   *       this.sendEmailForgetPass = sendEmailForgetPass;
   *       this.resetPassword = resetPassword;
   *       this.getUsers = getUsers;
   *       this.getRooms = getRooms;
   *       this.getRoomId = getRoomId;
   *       this.addRooms = addRooms;
   *       this.removeRooms = removeRooms;
   *       this.editRooms = editRooms;
   *       this.getWearableId = getWearableId;
   *       this.getWearables = getWearables;
   *       this.addWearable = addWearable;
   *       this.removeWearables = removeWearables;
   *       this.editWearables = editWearables;
   * }]);
   */
