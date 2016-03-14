(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching semanticModels from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('semanticModelService', function($q, SparqlService,
                    semanticModelRepository) {

        this.fetchRelated = function(obj) {
            return semanticModelRepository.getRelated(obj.id).then(function(related) {
                if (related.length) {
                    obj.related = related;
                    obj.hasLinks = true;
                }
                return obj;
            });
        };

        this.getById = function(id) {
            return semanticModelRepository.getById(id);
        };

        this.getRelated = function(id) {
            return semanticModelRepository.getRelated(id);
        };
    });
})();
