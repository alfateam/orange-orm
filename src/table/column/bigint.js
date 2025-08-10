var newEncode = require('./bigint/newEncode');
var newDecode = require('./bigint/newDecode');
var formatOut = require('./formatOutGeneric');
var purify = require('./string/purify');

function _new(column) {
	column.tsType = 'BigintColumn';
	column.purify = purify;
	column.lazyDefault = '0';
	column.encode = newEncode(column);
	column.decode = newDecode(column);
	column.formatOut = (context, ...rest) => formatOut.apply(null, [context, column, 'formatBigintOut', ...rest]);

}

module.exports = _new;
