'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:UnitPageCtrl
 * @description
 * # UnitPageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('PersonDemoCtrl', function($routeParams, $q, $rootScope, eventService, personService) {
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

            return person.fetchRelated();
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
	 }
	 
    this.updateByUri($routeParams.uri);
    this.items= [];
    this.queryregex="";
    
   this.getItems= function () {
   	this.personService.getItems(this.queryregex,this);
   }
   this.getItems();

	this.updatePerson = function () {
		//console.log("update");
		//console.log(this.selectedItem);
		if (this.selectedItem && this.selectedItem.id) {
			this.updateByUri(this.selectedItem.id);
    }
	}
});


