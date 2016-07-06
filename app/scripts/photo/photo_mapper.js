(function() {
    'use strict';

    /*
    * Service for transforming photo SPARQL results into objects.
    */

    function Photo() { }

    function PhotoMapper() {
        this.objectClass = Photo;
    }

    PhotoMapper.prototype.makeObject = function(photo) {
        // Take the photo as received and turn it into an object that
        // is easier to handle.
        // Make the location a list as to support multiple locations per photo.
        var e = new this.objectClass();

        e.id = photo.id.value;
        e.url = photo.url.value;
        e.thumbnail = photo.thumbnail_url.value;
        e.description = photo.description ? photo.description.value : '';
        e.created = photo.created ? photo.created.value : undefined;
        e.participant_id = photo.participant_id ? photo.participant_id.value : '';
        e.municipality_id = photo.municipality ? photo.municipality.value : '';
        e.source = photo.source ? photo.source.value : '';
        e.creator_id = photo.creator ? photo.creator.value : undefined;
        e.photographer_string = photo.photographer_string ? photo.photographer_string.value : '';
        if (photo.place_string) {
            e.place_string = photo.place_string.value;
        }

        if (photo.place_id) {
            var place = {
                id: photo.place_id.value,
                label: photo.place_label ? photo.place_label.value : ''
            };
            if (photo.lat && photo.lon) {
                place.point = {
                    lat: photo.lat.value,
                    lon: photo.lon.value
                };
            }
            e.places = [place];
        }
        return e;
    };

    angular.module('eventsApp')
    .factory('photoMapperService', function(objectMapperService) {
        var proto = Object.getPrototypeOf(objectMapperService);
        PhotoMapper.prototype = angular.extend({}, proto, PhotoMapper.prototype);

        return new PhotoMapper();
    });
})();
