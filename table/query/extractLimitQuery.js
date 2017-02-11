var newParameterized = require('./newParameterized');

function extractLimitQuery(query, limit, table) {
    if (limit) {
        var primaryColumns = getPrimaryColumns();
        var sql = 'SELECT ' + primaryColumns + ',' + query.sql().slice(7);
        return newParameterized(sql, query.parameters);
    }

    function getPrimaryColumns() {
        var comma = ',';
        var columns = table._primaryColumns;
        var sql =  columns[0]._dbName;
        for (var i = 1; i < columns.length; i++) {
            sql = sql + comma + columns[i]._dbName;
        }
        return sql;
    }

}

module.exports = extractLimitQuery;
