var requireMock = require('a').requireMock;
var tryGetFromCacheById = requireMock('./tryGetFromCacheById');
var getFromDbById = requireMock('./getFromDbById');
var resultToPromise = requireMock('./resultToPromise');

var arg1 = {};
var arg2 = {};
var table = {};
var strategy = {};

function act(c) {
	c.resultToPromise = resultToPromise;
	c.table = table;
	c.arg1 = arg1;
	c.arg2 = arg2;
	c.strategy = strategy;
	c.tryGetFromCacheById = tryGetFromCacheById;
	c.getFromDbById = getFromDbById;
	c.sut = require('../getById');
	c.get = get;
	
	function get() {
		c.returned = c.sut(table,arg1,arg2,strategy);
	}

}


module.exports = act;