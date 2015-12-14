var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

var newContext = requireMock('./newContext');
var newColumn = requireMock('./table/column/newColumn');
var column = requireMock('./table/column');
var join = requireMock('./table/join');
var hasMany = requireMock('./table/hasMany');
var hasOne = requireMock('./table/hasOne');
var getMany = requireMock('./table/getMany');
var getById = requireMock('./table/getById');
var tryGetById = requireMock('./table/tryGetById');
var newRowCache = requireMock('./table/newRowCache');
var newObject = requireMock('./newObject');
var insert = requireMock('./table/insert');
var _delete = requireMock('./table/delete');
var cascadeDelete = requireMock('./table/cascadeDelete');
var createReadStream = requireMock('./table/createReadStream');
var createJSONReadStream = requireMock('./table/createJSONReadStream');

var tableName = {};

function act(c) {	

	c.insert = insert;
	c.context = {};
	newObject.expect().return(c.context);
	c.cache = {};
	newRowCache.expect(c.context).return(c.cache);
	c.tryGetFirstFromDb = requireMock('./table/tryGetFirstFromDb');
	c.getById = getById;
	c.tryGetById = tryGetById;
	c.getMany = getMany;
	c.hasOne = hasOne;
	c.hasMany = hasMany;
	c.join = join;
	c.newColumn = newColumn;		
	c.column = column;
	c.verifyEmptyRelations = verifyEmptyRelations;

	
	c.delete = {};
	_delete.bind = mock();
	_delete.bind.expect(null, c.context).return(c.delete);

	c.cascadeDelete = {};
	cascadeDelete.bind = mock();
	cascadeDelete.bind.expect(null, c.context).return(c.cascadeDelete);

	c.createReadStream = {};
	createReadStream.bind = mock();
	createReadStream.bind.expect(null, c.context).return(c.createReadStream);	

	c.createJSONReadStream = {};
	createJSONReadStream.bind = mock();
	createJSONReadStream.bind.expect(null, c.context).return(c.createJSONReadStream);	
	
	newSut();


	function newSut() {
		c.name = tableName;
		c.sut = require('../table')(tableName);
	}

	function verifyEmptyRelations() {
		 if (Object.prototype.toString.call(c.sut._relations) !== '[object Object]')
			throw "wrong type";			
		for (var name in c.sut._relations) {
			throw "has property";
		}
	}
}

module.exports = act;