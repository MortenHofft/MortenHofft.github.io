(function(){
angular.module('mapApp').controller('SuggestController', SuggestController);

function SuggestController ($http, layers, limitToFilter) {
    var self = this; 
    self.species = "";
    self.getSpecies = function (name) {
        //return [{canonicalName: 'puma concolor', speciesKey: 2435099}, {canonicalName: 'puma x', speciesKey: 2435099}, {canonicalName: 'puma xx', speciesKey: 2435099}];//TODO delete
        url = "//api.gbif.org/v1/species/suggest?callback=JSON_CALLBACK&rank=SPECIES&q=" + encodeURIComponent(name);
        return $http.jsonp(url).then(function (response) {
            return limitToFilter(response.data, 5);
        });
    };
    
    self.add = function(species){
        layers.addSpecies(species);
    };
    
    self.isValid = function(){
        return !!self.species && !!self.species.speciesKey;
    };
}

SuggestController.$inject = ['$http', 'layers', 'limitToFilter'];
})();