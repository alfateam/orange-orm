var newQuery = require('./getManyDto/newQuery');
var strategyToSpan = require('./strategyToSpan');
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
var executeQueries = require('./executeQueries');

function getManyDto(table, filter, strategy) {
    var alias = table._dbName;
    filter = negotiateRawSqlFilter(filter);
    var span = strategyToSpan(table, strategy);
    var query = newQuery(table, filter, span, alias);
    return executeQueries([query]).then(onResults).then(onSingleResult);

    function onResults(rowsPromises) {
        return rowsPromises[0];
    }

    function onSingleResult(result) {
        for(var p in result[0]) {
            let res =  result[0][p];
            return res;
        }
    }

}

module.exports = getManyDto;