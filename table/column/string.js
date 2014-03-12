var newEncode = require('./string/newEncode');
var newDecode = require('./newDecodeCore');
var startsWith = require('./string/startsWith');
var endsWith = require('./string/endsWith');
var contains = require('./string/contains');

function _new(column) {
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