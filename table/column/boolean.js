var newEncode = require('./boolean/newEncode');
var newDecode = require('./newDecodeCore');
var purify = require('./boolean/purify');

function _new(column) {
	column.purify = purify;
	column.default = false;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;