function newManyRelatedToDto(relationName, relation, strategy, dto) {	
	var subStrategy = strategy[relationName];
	var subTable = relation.childTable;
	return relatedToDto;	

	function relatedToDto(rows) {
		return rows.toDto(subStrategy).then(onDtos);
	}

	function onDtos(dtos) {
		dto[relationName] = dtos;
	}
}

module.exports = newManyRelatedToDto;