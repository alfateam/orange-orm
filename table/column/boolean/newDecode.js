var purify = require('./purify');

function _new(column) {

	return function(value) {
		if (value == column.dbNull)
			return null;
		return purify(value);
	};
}

module.exports = _new;