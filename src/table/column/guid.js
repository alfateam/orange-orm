var newEncode = require('./guid/newEncode');
var newDecode = require('./guid/newDecode');
var purify = require('./guid/purify');

function _new(column) {
	column.tsType = 'UUIDColumn';
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;