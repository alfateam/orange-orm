var newEncode = require('./string/newEncode');
var newDecode = require('./newDecodeCore');
var startsWith = require('./string/startsWith');
var endsWith = require('./string/endsWith');
var contains = require('./string/contains');
var iStartsWith = require('./string/iStartsWith');
var iEndsWith = require('./string/iEndsWith');
var iContains = require('./string/iContains');
var iEqual = require('./string/iEqual');
var purify = require('./string/purify');
var _extractAlias = require('./extractAlias');

function _new(table, column) {
	column.tsType = 'StringColumn';
	column.purify = purify;
	column.encode = newEncode(column);
	column.decode = newDecode(column);
	var extractAlias = _extractAlias.bind(null, table);

	column.startsWith = function(context, arg, alias) {
		alias = extractAlias(alias);
		return startsWith(context, column, arg, alias);
	};
	column.endsWith = function(context, arg, alias) {
		alias = extractAlias(alias);
		return endsWith(context, column, arg, alias);
	};
	column.contains = function(context, arg, alias) {
		alias = extractAlias(alias);
		return contains(context, column, arg, alias);
	};
	column.iStartsWith = function(context, arg, alias) {
		alias = extractAlias(alias);
		return iStartsWith(context, column, arg, alias);
	};
	column.iEndsWith = function(context, arg, alias) {
		alias = extractAlias(alias);
		return iEndsWith(context, column, arg, alias);
	};
	column.iContains = function(context, arg, alias) {
		alias = extractAlias(alias);
		return iContains(context, column, arg, alias);
	};

	column.iEqual = function(context, arg, alias) {
		alias = extractAlias(alias);
		return iEqual(context, column, arg, alias);
	};

	column.iEq = column.iEqual;
	column.IEQ = column.iEqual;
	column.ieq = column.iEqual;
}

module.exports = _new;
