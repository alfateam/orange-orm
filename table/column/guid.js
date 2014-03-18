var newEncode = require('./guid/newEncode');
var newDecode = require('./newDecodeCore');

function _new(column) {
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;