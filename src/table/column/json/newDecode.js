let newDecodeCore = require('../newDecodeCore');
let getSessionContext = require('../../getSessionContext');

function _new(column) {
	let decodeCore = newDecodeCore(column);

	return function(value) {
		value = decodeCore(value);
		if (value === null)
			return value;
		if (typeof value !== 'object') {
			let decode = getSessionContext().decodeJSON;
			if (decode)
				return decode(value);
			return value;
		}
		return value;
	};
}

module.exports = _new;