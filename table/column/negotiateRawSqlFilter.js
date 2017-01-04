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
            var sql = filter.sql;
            if (typeof filter.sql == 'function') {                
                sql = filter.sql();
            }
            params.push(sql, filter.parameters);
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