var negotiateRawSqlFilter = require('./table/column/negotiateRawSqlFilter');
var parameterized = require('./table/query/newParameterized')('');
function emptyFilter() {
    return emptyFilter.and.apply(null, arguments);
}

emptyFilter.sql = parameterized.sql;
emptyFilter.parameters = parameterized.parameters;

emptyFilter.and = function(other) {
    other = negotiateRawSqlFilter(other);
    for (var i = 1; i < arguments.length; i++) {
        other = other.and(arguments[i]);
    }
    return other;
};

emptyFilter.or = function(other) {
    other = negotiateRawSqlFilter(other);
    for (var i = 1; i < arguments.length; i++) {
        other = other.or(arguments[i]);
    }
    return other;
};

emptyFilter.not = function() {
    return emptyFilter;
};

module.exports = emptyFilter;
