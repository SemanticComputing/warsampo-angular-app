'use strict';

angular.module('eventsApp')
.service('dateUtilService', function($filter, _) {

    this.formatDate = formatDate;
    this.isFullYear = isFullYear;
    this.getExtremeDate = getExtremeDate;
    this.formatDateRange = formatDateRange;
    this.formatExtremeDateRange = formatExtremeDateRange;
    this.changeDateAndFormat = changeDateAndFormat;

    function getExtremeDate(dates, min) {
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
    }

    function isFullYear(start, end) {
        return start.getDate() === 1 && start.getMonth() === 0 && end.getDate() === 31 &&
            end.getMonth() === 11;
    }

    function formatDateRange(start, end) {
        if (this.isFullYear(start, end)) {
            var start_year = start.getFullYear();
            var end_year = end.getFullYear();
            return start_year === end_year ? start_year : start_year + '-' + end_year;
        }
        if (end - start) {
            return this.formatDate(start) + '-' + this.formatDate(end);
        }
        return this.formatDate(start);
    }

    function formatExtremeDateRange(start, end) {
        var s = this.getExtremeDate(start, true);
        var e = this.getExtremeDate(end, false);
        var time = this.formatDateRange(s, e);

        return time;
    }

    function changeDateAndFormat(date, days) {
        var d = new Date(date);
        d.setDate(d.getDate() + days);
        return d.toISODateString();
    }

    function formatDate(date, format) {
        format = format || 'dd.MM.yyyy';
        return $filter('date')(date, format);
    }

});
