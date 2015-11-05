'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function SemanticModel() { }

SemanticModel.prototype.nonProperties = ['type', 'label', 'id', 'properties',
    'fetchRelated', 'nonProperties'];

function SemanticModelMapper() { }

SemanticModelMapper.prototype.postProcess = function(objects) {
    _.forEach(objects, function(o) {
        o.properties = {};
        _.forIn(o, function(v, k) {
            if (o.nonProperties.indexOf(k) === -1) {
                o.properties[k] = v;
                if (_.isArray(v)) {
                    o.properties[k].ref = _.uniq(_.pluck(v, 'ref'));
                } else {
                    o.properties[k] = [v];
                }
                delete o[k];
            }
        });
    });
    return objects;
};

SemanticModelMapper.prototype.makeObject = function(obj) {
    var o = new SemanticModel();

    o.id = obj.id.value;
    o.type = {
        id: obj.type.value,
        label: obj.type_label ? obj.type_label.value : null
    };
    o.label = obj.label ? obj.label.value : 
        _.kebabCase(obj.id.value.match(/[#/]([\w-]+?)$/)[1]).replace(/-/g, " ");
    var objKey =  obj.pred.value;
    var prop = {};
    if (obj.obj) {
        prop = {
            type: obj.obj.type,
            value: obj.obj.value,
            label: obj.obj_label ? obj.obj_label.value : obj.obj.value,
        };
    }
    prop.ref = {
        type: obj.pred.value,
        label: obj.pred_label ? 
            obj.pred_label.value :
            _.kebabCase(obj.pred.value.match(/[#/]([\w-]+?)$/)[1]).replace(/-/g, " ")
    };

    o[objKey] = prop;

    return o;
};


angular.module('eventsApp')
    .factory('semanticModelMapperService', function(objectMapperService) {
        var proto = Object.getPrototypeOf(objectMapperService);
        SemanticModelMapper.prototype = angular.extend({}, proto, SemanticModelMapper.prototype);

        return new SemanticModelMapper();
})
    .factory('SemanticModel', function() {
        return SemanticModel;
});

