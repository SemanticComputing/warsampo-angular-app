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
        var startStr = this.formatDate(start);
        var endStr = this.formatDate(end);
        if (endStr !== startStr) {
            return startStr + '-' + endStr;
        }
        return startStr;
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
        return $filter('date')(date, format, 'Z');
    }

});
