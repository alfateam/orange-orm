var requireMock = require('a_mock').requireMock;
var newSelectQuery = requireMock('./newQuery');
var executeQuery = requireMock('./executeQuery');
var resultToRows = requireMock('./resultToRows');
var strategyToSpan = requireMock('./strategyToSpan');

function act(c) {
	c.newSelectQuery = newSelectQuery;
	c.executeQuery = executeQuery;
	c.resultToRows = resultToRows;
	c.strategyToSpan = strategyToSpan;
	c.sut = require('../getMany');
}

module.exports = act;