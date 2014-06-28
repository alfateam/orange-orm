var a = require('a');

function act(c) {
	c.then = a.then;
	c.mock = a.mock;
	c.requireMock = a.requireMock;

	c.strategyToSpan = c.requireMock('../strategyToSpan');
	c.addSubQueries = c.requireMock('../query/addSubQueries');
	c.executeQueries = c.requireMock('../executeQueries');
	c.resultToRows = c.requireMock('../resultToRows');

	c.parent = {};
	c.relation = {};

	c.sut = require('../getFarRelatives');
}

module.exports = act;