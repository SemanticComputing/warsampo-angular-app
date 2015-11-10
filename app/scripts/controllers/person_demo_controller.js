'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:UnitPageCtrl
 * @description
 * # UnitPageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('PersonDemoCtrl', function($routeParams, $location, $q, $scope, $rootScope, eventService, personService) {
    $rootScope.showSettings = null;
    $rootScope.showHelp = null;
    var self = this;
    this.personService=personService;
    
    
	 this.updateByUri = function(uri) {
	 	  self.isLoadingEvent = true;
        self.isLoadingLinks = false;
        personService.getById(uri)
        .then(function(person) {
            self.person = person; 
            self.isLoadingEvent = false;

            return person.fetchRelated2();
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
	 }
	 
    
    
    this.items= [];
    this.queryregex="";
    
    
   this.getItems= function () {
   	this.personService.getItems(this.queryregex,this);
   }
   this.getItems();

	this.updateActor = function () {
		if (this.selectedItem && this.selectedItem.id) {
			var uri=this.selectedItem.id;
			
			if (typeof $location !== 'undefined' && $location.search().uri != uri) {
            self.noReload = true;
            $location.search('uri', uri);
         }
         
			this.updateByUri(uri);
    }
	}
	
	// Set listener to prevent reload when it is not desired.
    $scope.$on('$routeUpdate', function() {
        if (!self.noReload) {
            $route.reload();
        } else {
            self.noReload = false;
        }
    });
    
	if ($routeParams.uri) { 
		this.updateByUri($routeParams.uri); 
	} else { 
		this.selectedItem = { name: "Talvela, Paavo Juho", id: "http://ldf.fi/warsa/actors/person_50" };
		this.updateActor(); 
	}
});


