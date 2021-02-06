var newEncode = require('./json/newEncode');
var newDecode = require('./newDecodeCore');
var purify = require('./json/purify');
var onChange = require('on-change');

function _new(column) {
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
	column.onChange = onChange;
}

module.exports = _new;