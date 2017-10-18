var app = angular.module('torvals');

app.controller('DocsController', function(Document) {
    var vm = this;
    Document.query({}, function(documents){
        vm.documents = documents;
    });
    return vm;
})
.controller('DocsDetailController', function(Document, $stateParams) {
    var vm = this;
    Document.get({id: $stateParams.document_id}, function(doc){
        vm.doc = doc;
        console.info(vm.doc);
    });
    return vm;
});
