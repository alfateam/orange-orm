var purify = require('./purify');

function _new(column) {

	return function(context, value) {
		if (value == column.dbNull)
			return null;
		return purify(value);
	};
}

module.exports = _new;