var newEncode = require('./numeric/newEncode');
var newDecode = require('./numeric/newDecode');
var purify = require('./numeric/purify');

function _new(column) {
	column.tsType = 'NumberColumn';
	// if (!column.isPrimary)
	// 	column.default = 0;
	column.lazyDefault = 0;
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
}

module.exports = _new;