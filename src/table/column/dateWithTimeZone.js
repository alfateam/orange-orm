var newEncode = require('./dateWithTimeZone/newEncode');
var newDecode = require('./date/newDecode');
var formatOut = require('./date/formatOut');
var purify = require('./date/purify');

function _new(column) {
	column.tsType = 'DateColumn';
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
	column.formatOut = formatOut.bind(null, column);
}

module.exports = _new;