(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */
    angular.module('eventsApp')
    .factory('semanticModelMapperService', semanticModelMapperService);

    /* ngInject */
    function semanticModelMapperService(_, objectMapperService, TranslateableObject) {
        var imageTypes = ['png', 'jpg', 'jpeg', 'gif'];
        // If other location uris are required, these can be made into lists
        var imageUri = 'http://schema.org/contentUrl';
        var latUri = 'http://www.w3.org/2003/01/geo/wgs84_pos#lat';
        var lonUri = 'http://www.w3.org/2003/01/geo/wgs84_pos#long';

        var objProto = Object.getPrototypeOf(TranslateableObject);
        SemanticModel.prototype = angular.extend({}, objProto, TranslateableObject.prototype);
        SemanticModel.prototype.nonProperties = ['type', 'label', 'id', 'properties',
            'fetchRelated', 'nonProperties', 'lat', 'lon', 'imageUrl', 'link', 'getLabel',
            'getDescription', 'getLangAttr'];

        var proto = Object.getPrototypeOf(objectMapperService);
        SemanticModelMapper.prototype = angular.extend({}, proto, SemanticModelMapper.prototype);

        SemanticModelMapper.prototype.postProcess = postProcess;
        SemanticModelMapper.prototype.makeObject = makeObject;

        return new SemanticModelMapper();

        function SemanticModel() { }

        function SemanticModelMapper() { }

        function postProcess(objects) {
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
        }

        function makeObject(obj) {
            var o = new SemanticModel();

            o.id = obj.id.value;
            if (obj.type) {
                o.type = {
                    id: obj.type.value,
                    label: getLabel(obj, 'type', 'type_label')
                };
            }
            o.label = getLabel(obj, 'id', 'label');

            if (obj.link) {
                o.link = {
                    id: obj.link.value,
                    label: getLabel(obj, 'link', 'link_label')
                };
            }

            if (!obj.pred) {
                return o;
            }

            var objKey =  obj.pred.value;
            var prop = {};
            prop = {
                type: obj.obj.type,
                value: obj.obj.value,
                label: obj.obj_label ? obj.obj_label.value : obj.obj.value,
                pred_type: obj.pred.value,
                pred_label: getLabel(obj, 'pred', 'pred_label')
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

            return o;
        }

        function getLabel(obj, value, labelProp) {
            return obj[labelProp] ?
                obj[labelProp].value :
                _.kebabCase(obj[value].value.match(/[#/]([\w-]+?)$/)[1]).replace(/-/g, ' ');
        }
    }
})();
