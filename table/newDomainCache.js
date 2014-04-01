var newId = require('../newId');
var newCache = require('./newCache');

function newDomainCache(optionalId) {
	var c = {};
	var id = newId();

	c.tryGet = function(key) {		
		var cache = process.domain[id] || _newCache();		
		return cache.tryGet(key);
	};

	c.add = function(key, value) {
		var cache = process.domain[id] || _newCache();		
		return cache.add(key,value);

	};

	c.getAll = function() {
		var cache = process.domain[id] || _newCache();		
		return cache.getAll();	
	};

	function _newCache () {
		var cache = newCache();
		process.domain[id] = cache;
		return cache;
	}
	return c;
};

module.exports = newDomainCache;