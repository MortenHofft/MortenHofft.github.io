angular.module('mapApp', ['ui.bootstrap', 'leaflet-directive']);

angular.module('mapApp').factory('layers', function () {
    var layers = {};
    layers.list = {};
    layers.colors = [
        'yellows_reds',
        'blues',
        'greens',
        'greys',
        'oranges',
        'purples',
        'reds'    
    ]; 
    
    layers.getNextColorScheme = function(){
        return layers.colors[ Object.keys(layers.list).length % layers.colors.length ];
    };
    
    layers.addSpecies = function (species) {
        layers.list[species.canonicalName] = {
            name: species.canonicalName,
            url: 'http://cdn.gbif.org/v1/map/density/tile.png?key='+ species.speciesKey +'&resolution=4&x={x}&y={y}&z={z}&type=TAXON&palette=' + layers.getNextColorScheme(),
            type: 'xyz',
            visible: true
        };
    };

    //Object.freeze(layers);//TODO find alternative that allows for testing
    return layers;
});

/*
//TODO create high level wrapper for the api a la:
angular.module('mapApp').factory("gbifAPI", function($resource) {
    return $resource("http://api.gbif.org/v1/species/suggest?",
        { callback: "JSON_CALLBACK", rank: "SPECIES" },
        { get: { method: "JSONP", isArray: true }}
    );
});
*/