var requireMock = require('a').requireMock;
var newSelectQuery = requireMock('./newQuery');
var executeQuery = requireMock('./executeQuery');
var resultToRows = requireMock('./resultToRows');
var strategyToSpan = requireMock('./strategyToSpan');
var newParameterized = requireMock('./query/newParameterized');
var emptyInnerJoin = {};

function act(c) {
	c.emptyInnerJoin  = emptyInnerJoin;
	newParameterized.expect().return(emptyInnerJoin);
	c.newSelectQuery = newSelectQuery;
	c.executeQuery = executeQuery;
	c.resultToRows = resultToRows;
	c.strategyToSpan = strategyToSpan;
	c.sut = require('../getMany');
}

module.exports = act;