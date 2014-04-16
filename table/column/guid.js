var newEncode = require('./guid/newEncode');
var newDecode = require('./newDecodeCore');
var purify = require('./guid/purify');

function _new(column) {
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;