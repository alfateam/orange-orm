var newDecodeDbRow = require('./newDecodeDbRow');

function decodeDbRow(span, table, dbRow) {
	var decode = span._decodeDbRow;
	if (!decode) {
		let aliases = new Set();
		if (span.columns)
			span.columns.forEach((value, key) => {
				if (value)
					aliases.add(key.alias);
			});
		decode = newDecodeDbRow(table, dbRow, aliases);
		Object.defineProperty(span, '_decodeDbRow', {
			enumerable: false,
			get: function () {
				return decode;
			},
		});
	}
	return decode(dbRow);
}

module.exports = decodeDbRow;
