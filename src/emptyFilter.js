var negotiateRawSqlFilter = require('./table/column/negotiateRawSqlFilter');
var parameterized = require('./table/query/newParameterized')('');
function emptyFilter() {
	return emptyFilter.and.apply(null, arguments);
}

emptyFilter.sql = parameterized.sql.bind(parameterized);
emptyFilter.parameters = parameterized.parameters;

emptyFilter.and = function(context, other) {
	if (other === undefined) {
		other = context;
		context = null;
	}
	other = negotiateRawSqlFilter(context, other);
	for (var i = 2; i < arguments.length; i++) {
		other = other.and(context, arguments[i]);
	}
	return other;
};

emptyFilter.or = function(context, other) {
	if (other === undefined) {
		other = context;
		context = null;
	}
	other = negotiateRawSqlFilter(context, other);
	for (var i = 2; i < arguments.length; i++) {
		other = other.or(context, arguments[i]);
	}
	return other;
};

emptyFilter.not = function(context, other) {
	if (other === undefined) {
		other = context;
		context = null;
	}
	other = negotiateRawSqlFilter(context, other).not(context);
	for (var i = 2; i < arguments.length; i++) {
		other = other.and(context, arguments[i]);
	}
	return other;

};

module.exports = emptyFilter;
