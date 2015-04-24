var newParameterized = function() {
    newParameterized = require('../query/newParameterized');
    return newParameterized.apply(null, arguments);
};

var newBoolean = function() {
    newBoolean = require('./newBoolean');
    return newBoolean.apply(null, arguments);
};

function negotiateRawSqlFilter(filter) {
    var params = [];
    if (filter) {
        if (filter.and)
            return filter;
        if (filter.sql) {
            params.push(filter.sql);
            params = params.concat(filter.parameters || []);
        }
        else
            params = [filter];
    } else {
        params = [filter];
    }
    var parameterized = newParameterized.apply(null, params);
    return newBoolean(parameterized);
}

module.exports = negotiateRawSqlFilter;