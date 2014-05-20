var newToDto = _newToDto;
var all = require('../../promise').all;

function _newToDto() {
	newToDto = require('./newToDto');
	return newToDto.apply(null,arguments);
}

function newSingleRelatedToDto(relationName, relation, strategy, dto) {

	var subStrategy = strategy[relationName];
	var subTable = relation.childTable;
	var toDto = newToDto(subStrategy, subTable);

	function relatedToDto(rows) {
		var promises = [];
		for (var i = 0; i < rows.length; i++) {			
			var promise = toDto(rows[i]);
			promises.push(promise);
		};
		return all(promises).then(onDtos);
	}

	return relatedToDto;

	function onDtos(dtos) {
		dto[relationName] = dtos;
	}
};

module.exports = newSingleRelatedToDto;