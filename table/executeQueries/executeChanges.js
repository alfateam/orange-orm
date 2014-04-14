var executeQuery = require('./executeQuery');
var newParameterized = require('../query/newParameterized');

function executeChanges(queries) {
	var merged = [];
	var queryCount = queries.length;
	var currentSet = [];
	for (var i = 0; i < queryCount; i++) {		
		var query = queries[i];
		if (query.parameters.length > 0) {
			addCurrentSet();
			merged.push(query);
		}
		else {
			currentSet.push(query);
		}		
	};
	
	addCurrentSet();

	function addCurrentSet() {
		if (currentSet.length == 0)		
			return;
		var sql;
		for (var i = 0; i < currentSet.length; i++) {
			var query = currentSet[i];
			if (sql)
				sql = sql + ';' + query.sql();
			else
				sql = query.sql();
		};
		var query = newParameterized(sql);
		merged.push(query);
		currentSet = [];
	}
	return executeQuery(merged[0]).then(thenNext);

	function thenNext() {

	}
	

	/*if (queries.length == 0)
		return;
	tryMergeQueries();

	function tryMergeQueries()	 {
		var currentSql = ;
		var index = 0;
		var queryCount = queries.length;
		while (index < queryCount) {
			tryMergeQuery(queries[0]);
		};

		function tryMergeQuery(query) {
			if (query.parameters.length > 0) {
				merged.push(query);
			}
			index++;
			if (index < queryCount) {
				var nextQuery = queries[index];
				tryMergeQueryWithNoParams(query, nextQuery);				
			}
			else
				merged.push(query);
		}

		function tryMergeQueryWithNoParams(query, nextQuery) {
			if (nextQuery.parameters.length == 0)
				var nextQuery = queries[index];				
			}
			else
				merged.push;
		}
	}	*/
}

module.exports = executeChanges;