(function(){
angular.module('mapApp').controller('LayerController', LayerController);

function LayerController(layers) {
    var self = this;
    self.visible = true;
    self.layers = layers.list;
    self.remove = function(layer){
        delete self.layers[layer.name];
        if (self.isEmpty()) self.visible = true;
    };
    
    self.isVisible = function(){
        return self.visible;
    };
    
    self.isEmpty = function(){
        return Object.keys(self.layers).length === 0;
    };
}

LayerController.$inject = ['layers'];
})();