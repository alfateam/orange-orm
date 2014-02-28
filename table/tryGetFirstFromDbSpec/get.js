var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;
var getMany = requireMock('./getMany');

function act(c) {
	c.mock = mock;	
	c.getMany = getMany;
	c.table = 't';
	c.filter = 'f';
	c.strategy = 's';
	c.rowsPromise = {};
	c.expected = {};
	
	c.sut = require('../tryGetFirstFromDb');
	c.getMany.expect(c.table,c.filter,c.strategy).return(c.rowsPromise);
	c.rowsPromise.then = c.mock();
	c.rowsPromise.then.expectAnything().whenCalled(onThen).return(c.expected);
	c.returned =  c.sut(c.table,c.filter,c.strategy);

	function onThen(callback) {
		c.resolve = callback;
	}
}

module.exports = act;