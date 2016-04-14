var newEncode = require('./json/newEncode');
var newDecode = require('./newDecode');
var purify = require('./json/purify');

function _new(column) {
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;