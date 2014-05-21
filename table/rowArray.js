var extractStrategy = require('./resultToRows/toDto/extractStrategy');
var newToDto = require('./resultToRows/toDto/newToDto');
var promise = require('./promise');

function newRowArray(table) {
	var c = [];

	c.toJSON = function(optionalStrategy) {
		var args = [].slice.call(arguments);
		args.push(table);
		var strategy = extractStrategy.apply(null, args);
		var promises = [];
		for (var i = 0; i < c.length; i++) {
			var row = c[i];
			var toDto = newToDto(strategy, table)(row);
			promises.push(toDto);
		};
		var all = promise.all(promises);
		return all.then(JSON.stringify);
	};

	return c;
};

module.exports = newRowArray;