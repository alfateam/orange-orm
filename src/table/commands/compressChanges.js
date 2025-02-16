var newParameterized = require('../query/newParameterized');
var getSessionSingleton = require('../getSessionSingleton');

function compress(context, queries) {
	var multipleStatements = getSessionSingleton(context, 'multipleStatements');
	var compressed = [];
	var queryCount = queries.length;

	for (var i = 0; i < queryCount; i++) {
		var current = queries[i];
		if (multipleStatements && current.parameters.length === 0 && !current.disallowCompress) {
			for (var i2 = i+1; i2 < queryCount; i2++) {
				var next = queries[i2];
				if (next.parameters.length > 0 || ! next.disallowCompress)
					break;
				current = newParameterized(current.sql() + ';' + next.sql());
				i++;
			}
		}
		compressed.push(current);
	}
	return compressed;
}

module.exports = compress;