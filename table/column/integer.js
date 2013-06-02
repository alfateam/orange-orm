var negotiateDefault = require('./integer/negotiateDefault');
var negotiateDbNull = require('./integer/negotiateDbNull');
var purify = require('./integer/purify');
var newEncode = require('./integer/newEncode');
var newDecode = require('./integer/newDecode');

function _new(column) {
	negotiateDefault(column);
	negotiateDbNull(column);
	column.encode = newEncode(column);
	column.purify = purify;
	column.decode = newDecode(column);
}

module.exports = _new;