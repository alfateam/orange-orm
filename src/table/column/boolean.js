var newEncode = require('./boolean/newEncode');
var newDecode = require('./boolean/newDecode');
var purify = require('./boolean/purify');

function _new(column) {
	column.tsType = 'BooleanColumn';
	column.purify = purify;
	// column.default = false;
	column.lazyDefault = false;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;