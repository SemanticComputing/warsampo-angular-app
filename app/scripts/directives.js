'use strict';

angular.module('eventsApp')
.directive('img', function(){
    return {
        restrict:'E',
        link:function(scope,element){
            element.error(function(){
                $(this).attr('src', 'images/no-image.png');
            });
        }
    };
});
