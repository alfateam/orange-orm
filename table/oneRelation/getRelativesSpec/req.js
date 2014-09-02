var a = require('a');

function act(c) {
	c.then = a.then;
	c.mock = a.mock;
	c.requireMock = a.requireMock;

	c.manyLegToQuery = c.requireMock('../query/addSubQueries/manyLegToQuery');
	c.executeQueries = c.requireMock('../executeQueries');
	c.resultToRows = c.requireMock('../resultToRows');

	c.resultToPromise = c.requireMock('../resultToPromise');

	c.emptyPromise = c.then();
	c.emptyPromise.resolve();
	c.resultToPromise.expect(false).return(c.emptyPromise);

	c.parent = {};
	c.relation = {};

	c.sut = require('../getRelatives');
}

module.exports = act;