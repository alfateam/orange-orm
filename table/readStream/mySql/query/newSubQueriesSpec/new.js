var a = require('a');

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;

	c.extractOrderBy = c.requireMock('../../extractOrderBy');

	c.sut = require('../newSubQueries');
}

module.exports = act;

