var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.parameterized = {};
	c.mock = mock;	
	c.emptyFilter = {};
	c.newParameterized = requireMock('./table/query/newParameterized');
	c.newParameterized.expect('').return(c.parameterized);
	c.newBoolean = requireMock('./table/column/newBoolean');
	c.table = requireMock('./table');
	c.newBoolean.expect(c.parameterized).return(c.emptyFilter);
	c.commit = requireMock('./table/commit');
	c.rollback = requireMock('./table/rollback');

	c.newDatabase = requireMock('./newDatabase');
		
	c.sut = require('../index');
}

module.exports = act;