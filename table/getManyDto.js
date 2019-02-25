var newQuery = require('./getManyDto/newQuery');
var strategyToSpan = require('./strategyToSpan');
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
var doQuery = require('../query');

function getManyDto(table, db, filter, strategy) {
    var alias = table._dbName;
    filter = negotiateRawSqlFilter(filter);
    var span = strategyToSpan(table, strategy);
    var query = newQuery(db, table, filter, span, alias);
    return doQuery(query).then(onResults);

    function onResults(rows) {
        return rows.json;
    }

}

module.exports = getManyDto;