var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.table = {};
	c.row = {};
	c.newInsertCommandCore = {};
	a.expectRequire('./newInsertCommandCore').return(c.newInsertCommandCore);
	c.newImmutable = requireMock('../../newImmutable');	
	c.createCommand = c.mock();
	c.newImmutable.expect(c.newInsertCommandCore).return(c.createCommand);

	c.sql = {};
	c.parameters = {};
	c.insertCommand = {};
	c.insertCommand.sql = c.mock();
	c.insertCommand.sql.expect().return(c.sql);
	c.insertCommand.parameters = c.parameters;
	c.createCommand.expect(c.table, c.row).return(c.insertCommand).repeatAny();

	c.sut = require('../newInsertCommand')(c.table, c.row);
}

module.exports = act;