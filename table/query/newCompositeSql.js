function _new() {
	var c = {};
	var queries = [];

	c.add = function(query) {
		queries.push(query);
	};

	c.sql = function() {
		var result = '';	
		var concat = concatenateFirst;

		for (var i = 0; i < queries.length; i++) {
			concat(i);
		};
		return result;

		function concatenateFirst() {
			result = queries[0].sql();
			concat = concatenateTail;
		}

		function concatenateTail(i) {
			result = result + ';' + queries[i].sql();
		}
	};

	return c;
}

module.exports = _new;