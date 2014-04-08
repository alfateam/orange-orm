var newId = require('../newId');
var _getCache = require('./domainCache/getCache');

function newDomainCache() {
	var c = {};
	var id = newId();

	c.tryGet = function(key) {		
		var cache = getCache();		
		return cache.tryGet(key);
	};

	c.tryAdd = function(key, value) {
		var cache = getCache();		
		return cache.tryAdd(key,value);
	};

	c.getAll = function() {
		var cache = getCache();		
		return cache.getAll();	
	};

	c.tryRemove = function(key) {
		var cache = getCache();		
		return cache.tryRemove(key);
	}

	c.subscribeAdded = function(onAdded) {
		var cache = getCache();		
		return cache.subscribeAdded(onAdded);
	};

	c.subscribeRemoved = function(onRemoved) {
		var cache = getCache();		
		return cache.subscribeRemoved(onRemoved);
	};

	function getCache() {
		return _getCache(id);
	}
	return c;
};

module.exports = newDomainCache;