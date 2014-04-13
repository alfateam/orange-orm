var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.table = {};
	c.column = {};
	c.alias = 'alias1';
	c.column.alias = c.alias;
	c.columnList = {};
	c.row = {};
	c.newUpdateCommandCore = {};
	a.expectRequire('./newUpdateCommandCore').return(c.newUpdateCommandCore);
	c.newImmutable = requireMock('../../newImmutable');	
	c.createCommand = c.mock();
	c.newImmutable.expect(c.newUpdateCommandCore).return(c.createCommand);

	c.row.subscribeChanged = mock();
	c.row.subscribeChanged.expectAnything().whenCalled(onSubscribe);
	c.raiseFieldChanged = function() {};
	
	function onSubscribe(cb) {
		c.raiseFieldChanged = cb;
	}

	c.sql = {};
	c.parameters = {};
	c.updateCommand = {};
	c.updateCommand.sql = c.mock();
	c.updateCommand.sql.expect().return(c.sql);
	c.updateCommand.parameters = c.parameters;
	c.createCommand.expect(c.table, c.columnList, c.row).return(c.updateCommand).repeatAny();

	c.newObject = requireMock('../../newObject');
	c.newObject.expect().return(c.columnList);

	c.sut = require('../newUpdateCommand')(c.table, c.column, c.row);
}

module.exports = act;