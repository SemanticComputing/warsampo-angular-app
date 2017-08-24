(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching arbitrary resources
    * from a SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('semanticModelService', semanticModelService);

    /* @ngInject */
    function semanticModelService(_, $q, semanticModelRepository) {

        var related = [
            { rel: 'warsa', title: 'TITLE', getRelated: semanticModelRepository.getRelatedWarsa.bind(semanticModelRepository) },
            { rel: 'dbpedia', title: 'DBpedia', getRelated: semanticModelRepository.getRelatedDbpedia.bind(semanticModelRepository) },
            { rel: 'dbpediafi', title: 'DBpedia FI', getRelated: semanticModelRepository.getRelatedDbpediaFi.bind(semanticModelRepository) }
        ];

        this.fetchRelated = function(obj) {
            return semanticModelRepository.getLinksById(obj.id).then(function(links) {
                _.forEach(related, function(r) {
                    var promises = _.map(_.uniqBy(_.flatten(links), 'id'), function(link) {
                        return r.getRelated(obj.id, link.id).then(function(rel) {
                            return { link: link, related: rel, endpoint: r.title, attr: r.rel };
                        });
                    });
                    obj.related = {};
                    return $q.all(promises).then(function(related) {
                        return $q.all(_.map(related, function(r) {
                            return r.related.getTotalCount().then(function(count) { r.hasLinks = !!count; });
                        })).then(function() {
                            return _.forEach(related, function(rel) {
                                if (rel.hasLinks) {
                                    obj.related[rel.attr] = obj.related[rel.attr] || { title: rel.endpoint, links: [] };
                                    obj.related[rel.attr].links.push(rel);
                                    obj.hasLinks = true;
                                }
                            });
                        });
                    });
                });
                return obj;
            });
        };

        this.getById = function(id) {
            return semanticModelRepository.getById(id);
        };
    }

})();
