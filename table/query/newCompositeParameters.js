var newCollection = require('../../newCollection');

function _new() {
	var collection = newCollection();
	var c = {};
	var queries = [];

	c.add = function(query) {
		collection.addRange(query.parameters());
	};

	c.forEach = function(callback) {
		collection.forEach(callback);
	};

	return c;
}

module.exports = _new;