var getSessionSingleton = require('../getSessionSingleton');
let bindToDomain = require('../../bindToDomain');

function resolveExecuteQuery(query) {
	return resolve;

	function resolve(success, failed) {
		try {

			success = bindToDomain(success);
			failed = bindToDomain(failed);

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