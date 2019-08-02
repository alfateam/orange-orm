var getSessionSingleton = require('../getSessionSingleton');

function resolveExecuteQuery(query) {
	return resolve;

	function resolve(success, failed) {
		try {

			var domain = process.domain;
			if (domain) {
				success = process.domain.bind(success);
				failed = process.domain.bind(failed);
			}

			var client = getSessionSingleton('dbClient');
			client.executeQuery(query, onCompleted);
		} catch (e) {
			failed(e);
		}

		function onCompleted(err, rows) {
			if (!err) {
				var lastIndex = rows.length - 1;
				if (!Array.isArray(rows[0]) && Array.isArray(rows[lastIndex]))
					rows = rows[lastIndex];
				success(rows);
			} else
				failed(err);
		}
	}


}

module.exports = resolveExecuteQuery;