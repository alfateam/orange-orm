function newDiscriminatorSql(table, alias) {
	var result = '';
	var formulaDiscriminators = table._formulaDiscriminators;
	var columnDiscriminators = table._columnDiscriminators;
	addFormula();
	addColumn();
	return result;

	function addFormula() {
		for (var i = 0; i<formulaDiscriminators.length; i++) {
			var current = formulaDiscriminators[i].replace('@this',alias);
			and();
			result += '(' + current + ')';
		}
	}

	function addColumn() {
		for (var i = 0; i< columnDiscriminators.length; i++) {
			var current = columnDiscriminators[i];
			and();
			result += alias + '.' + current;
		}
	}

	function and() {
		if(result)
			result += ' AND ';
		else
			result = ' ';	
	}
}

module.exports = newDiscriminatorSql;