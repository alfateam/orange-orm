var newEncode = require('./string/newEncode');
var newDecode = require('./newDecodeCore');
var startsWith = require('./string/startsWith');
var endsWith = require('./string/endsWith');
var contains = require('./string/contains');
var purify = require('./string/purify');

function _new(column) {
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
	
	column.startsWith = function(arg, optionalAlias) {
		return startsWith(column,arg,optionalAlias);
	}
	column.endsWith = function(arg, optionalAlias) {
		return endsWith(column,arg,optionalAlias);
	}	
	column.contains = function(arg, optionalAlias) {
		return contains(column,arg,optionalAlias);
	}
}

module.exports = _new;