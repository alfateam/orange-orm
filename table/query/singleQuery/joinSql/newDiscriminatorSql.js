function newDiscriminiatorSql(table, alias) {
	var result = '';
	var formulaDiscriminators = table.formulaDiscriminators;
	var columnDiscriminators = table.columnDiscriminators;
	addFormula();
	addColumn();
	return result;

	function addFormula() {
		for (var i = 0; i<formulaDiscriminators.length; i++) {
			var current = formulaDiscriminators[i].replace('@this',alias);
			and();
			result += '(' + current + ')';
		};	
	}

	function addColumn() {
		for (var i = 0; i< columnDiscriminators.length; i++) {
			var current = columnDiscriminators[i];
			and();
			result += alias + '.' + current;
		};	
	}

	function and() {
		if(result)
			result += ' AND ';
	}
}

module.exports = newDiscriminiatorSql;