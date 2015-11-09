var a = require('a');
var requireMock = a.requireMock;
var newSelectQuery = requireMock('./readStream/newQuery');
var executeQuery = requireMock('./readStream/executeQuery');
var resultToRows = requireMock('./readStream/resultToRows');
var strategyToSpan = requireMock('./strategyToSpan');
var negotiateRawSqlFilter = requireMock('./column/negotiateRawSqlFilter');

function act(c) {
	c.mock = a.mock;
	c.newSelectQuery = newSelectQuery;
	c.executeQuery = executeQuery;
	c.resultToRows = resultToRows;
	c.strategyToSpan = strategyToSpan;
	c.negotiateRawSqlFilter = negotiateRawSqlFilter;
	c.sut = require('../createReadStream');
}

module.exports = act;