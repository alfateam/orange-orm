var newDecodeDbRow = require('./newDecodeDbRow');

function decodeDbRow(context, span, table, dbRow, shouldValidate, isInsert) {
	var decodeCache = span._decodeDbRowCache;
	if (!decodeCache) {
		decodeCache = {};
		Object.defineProperty(span, '_decodeDbRowCache', {
			enumerable: false,
			get: function() {
				return decodeCache;
			},
		});
	}
	var cacheKey = (shouldValidate ? 'v' : 'nv') + (isInsert ? ':i' : ':u');
	var decode = decodeCache[cacheKey];
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
		decodeCache[cacheKey] = decode;
	}
	return decode(context, dbRow);
}

module.exports = decodeDbRow;
