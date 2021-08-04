var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.relation = {};
	c.parent = {};
	c.child = {};
	c.children = [c.child, {}, {}];

	c.sut = require('../negotiateExpandInverse');

	c.negotiate = function() {
		c.sut(c.parent, c.relation, c.children);
	}
}

module.exports = act;