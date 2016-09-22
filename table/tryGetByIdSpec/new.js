var a = require('a');
var requireMock = a.requireMock;
var tryGetFromCacheById = requireMock('./tryGetFromCacheById');
var tryGetFromDbById = requireMock('./tryGetFromDbById');
var resultToPromise = requireMock('./resultToPromise');

var arg1 = {};
var arg2 = {};
var table = {};
var strategy = {};

function act(c) {
	c.mock = a.mock;
	c.resultToPromise = resultToPromise;
	c.table = table;
	c.arg1 = arg1;
	c.arg2 = arg2;
	c.strategy = strategy;
	c.tryGetFromCacheById = tryGetFromCacheById;
	c.tryGetFromDbById = tryGetFromDbById;
	c.tryGetFromDbById.exclusive = c.mock();

	c.sut = require('../tryGetById');
	c.get = get;
	
	function get() {
		c.returned = c.sut(table,arg1,arg2,strategy);
	}

}


module.exports = act;