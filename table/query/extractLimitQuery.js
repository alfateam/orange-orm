var newParameterized = require('./newParameterized');

function extractLimitQuery(query, limit) {
    if (limit) {
        var sql = query.sql();
        var index = sql.indexOf(' from ');
        var sql = 'select *' + sql.slice(index);
        return newParameterized(sql, query.parameters);
    }

}

module.exports = extractLimitQuery;
