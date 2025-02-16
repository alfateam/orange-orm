let newDecodeCore = require('../newDecodeCore');
let getSessionContext = require('../../getSessionContext');

function _new(column) {
	let decodeCore = newDecodeCore(column);

	return function(context, value) {
		value = decodeCore(context, value);
		if (value === null)
			return value;
		if (typeof value !== 'object') {
			let decode = getSessionContext(context).decodeJSON;
			if (decode)
				return decode(value);
			return value;
		}
		return value;
	};
}

module.exports = _new;