var a = require('a');
var requireMock = a.requireMock;
var newSelectQuery = requireMock('./newQuery');
var executeQuery = requireMock('./executeQueries');
var resultToRows = requireMock('./resultToRows');
var strategyToSpan = requireMock('./strategyToSpan');
var newParameterized = requireMock('./query/newParameterized');
var negotiateRawSqlFilter = requireMock('./column/negotiateRawSqlFilter');
var emptyInnerJoin = {};

function act(c) {
    c.mock = a.mock;
    c.emptyInnerJoin = emptyInnerJoin;
    newParameterized.expect().return(emptyInnerJoin);
    c.newSelectQuery = newSelectQuery;
    c.executeQuery = executeQuery;
    c.resultToRows = resultToRows;
    c.strategyToSpan = strategyToSpan;
    c.negotiateRawSqlFilter = negotiateRawSqlFilter;

    c.sut = require('../getMany');

    c.table = {};
    c.initialFilter = {};
    c.filter = {};
    c.strategy = {};
    c.expected = {};
    c.queries = {};
    c.expected = {};
    c.span = {};
    c.dbName = '_theTable';
    c.table._dbName = c.dbName;

    c.strategyToSpan.expect(c.table, c.strategy).return(c.span);

    c.result = {};
    c.executeQuery.expect(c.queries).resolve(c.result);

    c.rows = {};
    c.resultToRows.expect(c.span, c.result).return(c.rows);

    c.negotiateRawSqlFilter.expect(c.initialFilter).return(c.filter);
}

module.exports = act;
