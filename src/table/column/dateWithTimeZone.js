var newEncode = require('./dateWithTimeZone/newEncode');
var newDecode = require('./date/newDecode');
var formatOut = require('./dateWithTimeZone/formatOut');
var purify = require('./date/purify');

function _new(column) {
	column.tsType = 'DateColumn';
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
	column.formatOut = (context, ...rest) => formatOut.apply(null, [context, column, ...rest]);
}

module.exports = _new;