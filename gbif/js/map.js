(function(){
angular.module('mapApp').controller('MapController', MapController);

function MapController($scope, layers) {
    var self = this;
    angular.extend(self, {
        Earth: {
            lat: 0,
            lng: 0,
            zoom: 2
        },
        layers: {
            baselayers: {
                osm: {
                    name: 'OpenStreetMap',
                    url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    type: 'xyz'
                }
            },
            overlays: layers.list
        }
    });
}

MapController.$inject = ['$scope', 'layers'];
})();