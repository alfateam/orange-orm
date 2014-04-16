var newEncode = require('./binary/newEncode');
var newDecode = require('./newDecodeCore');
var purify = require('./binary/purify');

function _new(column) {
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;