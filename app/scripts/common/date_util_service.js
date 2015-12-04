'use strict';

angular.module('eventsApp')
.service('dateUtilService', function() {
    this.getExtremeDate = function(dates, min) {
        if (_.isArray(dates)) {
            var fun;
            if (min) {
                fun = _.min;
            } else {
                fun = _.max;
            }
            return new Date(fun(dates, function(date) {
                return new Date(date);
            }));
        }
        if (!dates) {
            return undefined;
        }
        return new Date(dates);
    };

    this.isFullYear = function(start, end) {
        return start.getDate() === 1 && start.getMonth() === 0 && end.getDate() === 31 &&
            end.getMonth() === 11;
    };

    this.formatDateRange = function(start, end) {
        if (this.isFullYear(start, end)) {
            var start_year = start.getFullYear();
            var end_year = end.getFullYear();
            return start_year === end_year ? start_year : start_year + '-' + end_year;
        }
        if (end - start) {
            return start.toLocaleDateString() + '-' + end.toLocaleDateString();
        }
        return start.toLocaleDateString();
    };
    
    this.formatExtremeDateRange = function(start, end) {
        var s = this.getExtremeDate(start, true);
        var e = this.getExtremeDate(end, false);
        var time = this.formatDateRange(s, e);

        return time;
    };
});
