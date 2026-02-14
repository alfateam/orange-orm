var getSessionSingleton = require('../../getSessionSingleton');
var newParameterized = require('../../query/newParameterized');

function newLikeColumnArg(context, column, encodedArg, prefix, suffix) {
	var encodedPrefix = prefix ? column.encode(context, prefix) : null;
	var encodedSuffix = suffix ? column.encode(context, suffix) : null;
	var engine = getSessionSingleton(context, 'engine');

	if (engine === 'mysql')
		return concatWithFunction(encodedPrefix, encodedArg, encodedSuffix);
	if (engine === 'mssql' || engine === 'mssqlNative')
		return concatWithOperator('+', encodedPrefix, encodedArg, encodedSuffix);
	return concatWithOperator('||', encodedPrefix, encodedArg, encodedSuffix);
}

function concatWithFunction(prefix, value, suffix) {
	var args = [prefix, value, suffix].filter(Boolean);
	var sql = 'CONCAT(' + args.map(x => x.sql()).join(',') + ')';
	var parameters = [];
	for (var i = 0; i < args.length; i++)
		parameters = parameters.concat(args[i].parameters);
	return newParameterized(sql, parameters);
}

function concatWithOperator(operator, prefix, value, suffix) {
	var args = [prefix, value, suffix].filter(Boolean);
	var sql = '';
	var parameters = [];
	for (var i = 0; i < args.length; i++) {
		if (i > 0)
			sql += ' ' + operator + ' ';
		sql += args[i].sql();
		parameters = parameters.concat(args[i].parameters);
	}
	return newParameterized(sql, parameters);
}

module.exports = newLikeColumnArg;
