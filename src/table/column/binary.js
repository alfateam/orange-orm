var newEncode = require('./binary/newEncode');
var newDecode = require('./binary/newDecode');
var purify = require('./binary/purify');

function _new(column) {
	column.tsType = 'BinaryColumn';
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;