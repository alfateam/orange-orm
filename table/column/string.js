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
    column.purify = purify;
    column.encode = newEncode(column);
    column.decode = newDecode(column);
    var extractAlias = _extractAlias.bind(null, table);

    column.startsWith = function(arg, alias) {
        alias = extractAlias(alias);
        return startsWith(column, arg, alias);
    };
    column.endsWith = function(arg, alias) {
        alias = extractAlias(alias);
        return endsWith(column, arg, alias);
    };
    column.contains = function(arg, alias) {
        alias = extractAlias(alias);
        return contains(column, arg, alias);
    };
    column.iStartsWith = function(arg, alias) {
        alias = extractAlias(alias);
        return iStartsWith(column, arg, alias);
    };
    column.iEndsWith = function(arg, alias) {
        alias = extractAlias(alias);
        return iEndsWith(column, arg, alias);
    };
    column.iContains = function(arg, alias) {
        alias = extractAlias(alias);
        return iContains(column, arg, alias);
    };

    column.iEqual = function(arg, alias) {
        alias = extractAlias(alias);
        return iEqual(column, arg, alias);
    };

    column.iEq = column.iEqual;
}

module.exports = _new;
