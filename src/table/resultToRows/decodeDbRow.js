var newDecodeDbRow = require('./newDecodeDbRow');

function decodeDbRow(context, span, table, dbRow, shouldValidate, isInsert) {
	var decode = span._decodeDbRow;
	if (!decode) {
		let aliases = new Set();
		if (span.columns)
			span.columns.forEach((value, key) => {
				if (value)
					aliases.add(key.alias);
			});
		if (aliases.size === 0)
			aliases = undefined;
		decode = newDecodeDbRow(table, dbRow, aliases, shouldValidate, isInsert);
		Object.defineProperty(span, '_decodeDbRow', {
			enumerable: false,
			get: function() {
				return decode;
			},
		});
	}
	return decode(context, dbRow);
}

module.exports = decodeDbRow;
