(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('RankPageController', RankPageController);
    
    /* @ngInject */
    function RankPageController($route, rankService) {
        var self = this;

        if ($route.current.locals.uri) {
            self.isLoadingRank = true;
            self.isLoadingPersons = false;
            rankService.getById($route.current.locals.uri)
            .then(function(rank) {
                self.rank = rank;
                self.isLoadingRank = false;
                self.isLoadingPersons = true;
                return rankService.fetchRelated(rank);
            })
            .then(function() {
                self.isLoadingPersons = false;
            }).catch(function() {
                self.isLoadingRank = false;
                self.isLoadingPersons = false;
            });
        }
    }
})();
