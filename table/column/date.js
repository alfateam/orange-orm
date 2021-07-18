var newEncode = require('./date/newEncode');
var newDecode = require('./date/newDecode');
var purify = require('./date/purify');

function _new(column) {
	column.tsType = 'DateColumn';
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;