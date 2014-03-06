var negotiateDefault = require('./integer/negotiateDefault');
var purify = require('./integer/purify');
var newEncode = require('./integer/newEncode');
var newDecode = require('./newDecodeCore');

function _new(column) {
	negotiateDefault(column);
	column.encode = newEncode(column);
	column.purify = purify;
	column.decode = newDecode(column);
}

module.exports = _new;