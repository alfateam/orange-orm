var newEncode = require('./json/newEncode');
var newDecode = require('./json/newDecode');
var formatOut = require('./json/formatOut');
var purify = require('./json/purify');
var onChange = require('@lroal/on-change');
let clone = require('rfdc/default');

function _new(column) {
	column.tsType = 'JSONColumn';
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
	column.formatOut = (context, ...rest) => formatOut.apply(null, [context, column, ...rest]);

	column.onChange = onChange;
	column.toDto = toDto;
}

function toDto(value) {
	return clone(value);
}

module.exports = _new;