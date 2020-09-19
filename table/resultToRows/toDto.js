var resultToPromise = require('../resultToPromise');
var createDto = require('./toDto/createDto');

function toDto(strategy, table, row) {
	var dto = createDto(table, row);
	strategy = strategy || {};
	var promise = resultToPromise(dto);

	for (var property in strategy) {
		mapChild(property);
	}

	function mapChild(name) {
		promise = promise.then(getRelated).then(onChild);

		function getRelated() {
			return row[name];
		}

		function onChild(child) {
			if (child)
				return child.__toDto(strategy[name]).then(onChildDto);
		}

		function onChildDto(childDto) {
			dto[name] = childDto;
		}
	}

	return promise.then(function() {
		return dto;
	});
}

module.exports = toDto;
