var a = require('a');
var requireMock = a.requireMock;

function act(c) {
	c.then = a.then;
	c.mock = a.mock;
	c.extractParentKey = requireMock('../relation/manyCache/extractParentKey');
	c.resultToPromise = requireMock('../resultToPromise');
	c.getFarRelatives = requireMock('./getFarRelatives');

	c.empty = c.then();
	c.empty.resolve(false);
	c.resultToPromise.expect(false).return(c.empty);
	c.parentRow = {};
	c.relation = {};

	c.sut = require('../tryGetByHeuristic');
}

module.exports = act;