var a = require('a');
var requireMock = a.requireMock;

function act(c) {
	c.then = a.then;
	c.mock = a.mock;
	c.resultToPromise = requireMock('../resultToPromise');
	c.getRelatives = requireMock('./getRelatives');

	c.empty = c.then();
	c.empty.resolve(false);
	c.resultToPromise.expect(false).return(c.empty);
	c.parentRow = {};
	c.relation = {};

	c.sut = require('../getRelatives');
}

module.exports = act;