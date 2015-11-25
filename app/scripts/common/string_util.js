'use strict';

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

if (!Date.prototype.toISODateString) {
    Date.prototype.toISODateString = function() {
        return this.toISOString().slice(0, 10);
    };
}
