(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching arbitrary resources
    * from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('semanticModelService', semanticModelService);

    /* @ngInject */
    function semanticModelService(_, $q, SparqlService, semanticModelRepository) {

        this.fetchRelated = function(obj) {
            var links;
            if (obj.link) {
                links = _.isArray(obj.link) ? obj.link : [obj.link];
            } else {
                return $q.when(obj);
            }
            var promises = _.map(links, function(link) {
                return semanticModelRepository.getRelated(obj.id, link)
                .then(function(rel) {
                    return { link: link, related: rel };
                });
            });
            return $q.all(promises).then(function(related) {
                obj.related = [];
                _.forEach(related, function(rel) {
                    obj.related.push(rel);
                    obj.hasLinks = true;
                });
                return obj;
            });
        };

        this.getById = function(id) {
            return semanticModelRepository.getById(id);
        };
    }
})();
