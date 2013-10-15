var a = require('a');
var requireMock = a.requireMock;

var newContext = requireMock('./newContext');
var primaryColumn = requireMock('./table/primaryColumn');
var column = requireMock('./table/column');
var join = requireMock('./table/join');
var hasMany = requireMock('./table/hasMany');
var hasOne = requireMock('./table/hasOne');
var getMany = requireMock('./table/getMany');
var getById = requireMock('./table/getById');

var tableName = {};

function act(c) {
	c.getById = getById;
	c.getMany = getMany;
	c.hasOne = hasOne;
	c.hasMany = hasMany;
	c.join = join;
	c.primaryColumn = primaryColumn;		
	c.column = column;
	newSut();


	function newSut() {
		c.name = tableName;
		c.sut = require('../table')(tableName);
	}
}

module.exports = act;