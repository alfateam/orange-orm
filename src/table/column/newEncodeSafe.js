var newPara = require('../query/newParameterized');

function _newSafe(column, purify) {

	return function(value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		return newPara('?', [value]);
	};
}

module.exports = _newSafe;