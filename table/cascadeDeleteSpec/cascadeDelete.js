var a = require('a');

function act(c){
	c.expected = {};
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.delete = c.requireMock('./delete');
	c.delete.expect(c.table, c.filter, c.strategy).return(c.expected);

	c.newObject = c.requireMock('../newObject');
	c.emptyObject = {};
	c.newObject.expect().return(c.emptyObject);

	c.newCascadeDeleteStrategy = c.requireMock('./newCascadeDeleteStrategy');
	c.newCascadeDeleteStrategy.expect(c.emptyObject, c.table).return(c.strategy);						

	c.returned = c.sut = require('../cascadeDelete')(c.table, c.filter);
}

module.exports = act;