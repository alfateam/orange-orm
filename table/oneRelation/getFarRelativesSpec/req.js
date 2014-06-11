var a = require('a');
var requireMock = a.requireMock;

function act(c) {
	c.then = a.then;
	c.mock = a.mock;
	c.extractParentKey = requireMock('../relation/manyCache/extractParentKey');
	c.resultToPromise = requireMock('../resultToPromise');
	c.newFarRelativesFilter = requireMock('./newFarRelativesFilter');
	c.empty = {};
	c.resultToPromise.expect().return(c.empty);
	c.parentRow = {};
	c.relation = {};

	c.sut = require('../getFarRelatives');
}

module.exports = act;