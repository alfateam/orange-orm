var newPara = require('../../query/newParameterized');
var purify = require('./purify');

function _new(column) {

	return function(value) {

		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		return newPara("'" + value.toISOString() + "'");
	}

}

module.exports = _new;