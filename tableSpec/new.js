var a = require('a');
var requireMock = a.requireMock;

var newContext = requireMock('./newContext');
var newColumn = requireMock('./table/column/newColumn');
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
	c.newColumn = newColumn;		
	c.column = column;
	c.verifyEmptyRelations = verifyEmptyRelations;
	newSut();


	function newSut() {
		c.name = tableName;
		c.sut = require('../table')(tableName);
	}

	function verifyEmptyRelations() {
		 if (Object.prototype.toString.call(c.sut._relations) !== '[object Object]')
			throw "wrong type";			
		for (name in c.sut._relations) {
			throw "has property";
		}
	}
}

module.exports = act;