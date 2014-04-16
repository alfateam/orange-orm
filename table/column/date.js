var newEncode = require('./date/newEncode');
var newDecode = require('./newDecodeCore');
var purify = require('./date/purify');

function _new(column) {
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;