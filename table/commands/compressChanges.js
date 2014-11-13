var newParameterized = require('../query/newParameterized');

function compress(queries) {
	var compressed = [];
	var queryCount = queries.length;
	var lastIndex = queryCount-1;
	
	for (var i = 0; i < queryCount; i++) {
		var current = queries[i];
		if (current.parameters.length == 0) {
			for (var i2 = i+1; i2 < queryCount; i2++) {
				var next = queries[i2];
				if (next.parameters.length > 0)
					break;
				current = newParameterized(current.sql() + ';' + next.sql());
				i++;
			}
		}
		compressed.push(current);
	};
	return compressed;
}

module.exports = compress;