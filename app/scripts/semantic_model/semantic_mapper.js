(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    function SemanticModel() { }

    SemanticModel.prototype.nonProperties = ['type', 'label', 'id', 'properties',
        'fetchRelated', 'nonProperties', 'lat', 'lon', 'imageUrl', 'link'];

    function SemanticModelMapper() { }

    SemanticModelMapper.prototype.postProcess = function(objects) {
        _.forEach(objects, function(o) {
            o.properties = {};
            _.forIn(o, function(v, k) {
                if (o.nonProperties.indexOf(k) === -1) {
                    o.properties[k] = v;
                    if (!_.isArray(v)) {
                        o.properties[k] = [v];
                    }
                    delete o[k];
                }
            });
        });
        return objects;
    };

    var imageTypes = ['png', 'jpg', 'jpeg', 'gif'];
    // If other location uris are required, these can be made into lists
    var imageUri = 'http://schema.org/contentUrl';
    var latUri = 'http://www.w3.org/2003/01/geo/wgs84_pos#lat';
    var lonUri = 'http://www.w3.org/2003/01/geo/wgs84_pos#long';

    SemanticModelMapper.prototype.makeObject = function(obj) {
        var o = new SemanticModel();

        o.id = obj.id.value;
        o.type = {
            id: obj.type.value,
            label: obj.type_label ? obj.type_label.value :
                _.kebabCase(obj.type.value.match(/[#/]([\w-]+?)$/)[1]).replace(/-/g, ' ')
        };
        o.label = obj.label ? obj.label.value :
            _.kebabCase(obj.id.value.match(/[#/]([\w-]+?)$/)[1]).replace(/-/g, ' ');
        var objKey =  obj.pred.value;
        var prop = {};
        prop = {
            type: obj.obj.type,
            value: obj.obj.value,
            label: obj.obj_label ? obj.obj_label.value : obj.obj.value,
            pred_type: obj.pred.value,
            pred_label: obj.pred_label ?
                    obj.pred_label.value :
                    _.kebabCase(obj.pred.value.match(/[#/]([\w-]+?)$/)[1]).replace(/-/g, " ")
        };

        // Check if this property is a URL to an image
        if (prop.pred_type === imageUri) {
            var imgMatch = prop.value.match(/\.(\w+?)$/);
            if (imgMatch && prop.type === 'literal') {
                if (_.includes(imageTypes, imgMatch[1])) {
                    o.imageUrl = prop.value;
                }
            }
        // Check if this property is a coordinate
        } else if (prop.pred_type === latUri) {
            o.lat = prop.value;
        } else if (prop.pred_type === lonUri) {
            o.lon = prop.value;
        }

        o[objKey] = prop;

        if (obj.link) {
            o.link = {
                id: obj.link.value,
                label: obj.link_label ? obj.link_label.value : ''
            };
        }

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
})();
