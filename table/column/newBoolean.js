var nextNewBoolean = _nextNewBoolean;
var negotiateRawSqlFilter = require('./negotiateRawSqlFilter');
var negotiateNextAndFilter = require('./negotiateNextAndFilter');
var negotiateNextOrFilter = require('./negotiateNextOrFilter');

function newBoolean(filter) {
    var c = {};
    c.sql = filter.sql.bind(filter);
    c.parameters = filter.parameters;

    c.append = function(other) {
        var nextFilter = filter.append(other);
        return nextNewBoolean(nextFilter);
    };

    c.prepend = function(other) {
        var nextFilter = filter.prepend(other);
        return nextNewBoolean(nextFilter);
    };

    c.and = function(other) {
        other = negotiateRawSqlFilter(other);
        var nextFilter = negotiateNextAndFilter(filter, other);
        var next = nextNewBoolean(nextFilter);
        for (var i = 1; i < arguments.length; i++) {
            next = next.and(arguments[i]);
        }
        return next;
    };

    c.or = function(other) {
        other = negotiateRawSqlFilter(other);
        var nextFilter = negotiateNextOrFilter(filter, other);
        var next = nextNewBoolean(nextFilter);
        for (var i = 1; i < arguments.length; i++) {
            next = next.or(arguments[i]);
        }
        return next;
    };

    c.not = function() {
        var nextFilter = filter.prepend('NOT (').append(')');
        return nextNewBoolean(nextFilter);
    };

    return c;
}

function _nextNewBoolean(filter) {
    nextNewBoolean = require('./newBoolean');
    return nextNewBoolean(filter);
}

module.exports = newBoolean;
