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
	c.sut = require('../tryGetById');
	c.get = get;
	c.getExclusive = getExclusive;
	
	function get() {
		c.returned = c.sut(table,arg1,arg2,strategy);
	}

	function getExclusive() {
		c.returned = c.sut.exclusive(table,arg1,arg2,strategy);
	}

}


module.exports = act;