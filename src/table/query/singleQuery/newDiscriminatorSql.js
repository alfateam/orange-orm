const getSessionSingleton = require('../../getSessionSingleton');

function newDiscriminatorSql(table, alias) {
	const quote = getSessionSingleton('quote');
	alias = quote(alias);
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
			var current = columnDiscriminators[i].split('=');
			and();
			result += alias + '.' + quote(current[0]) + '=' + current[1];
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