var newToDto = _newToDto;

function _newToDto() {
	newToDto = require('./newToDto');
	return newToDto.apply(null,arguments);
}

function newSingleRelatedToDto(relationName, relation, strategy, dto) {
	var subStrategy = strategy[relationName];
	var subTable = relation.childTable;
	var toDto = newToDto(subStrategy, subTable);

	function relatedToDto(row) {
		return toDto(row).then(onDto);
	}

	return relatedToDto;

	function onDto(subDto) {
		dto[relationName] = subDto;
	}
}

module.exports = newSingleRelatedToDto;