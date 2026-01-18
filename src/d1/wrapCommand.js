var log = require('../table/log');

function wrapCommand(_context, client) {
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = Array.isArray(query.parameters) ? query.parameters : [];
		var sql = query.sql();
		log.emitQuery({ sql, parameters: params });

		client.d1
			.prepare(sql)
			.bind.apply(null, params)
			.run()
			.then(onInnerCompleted, (e) => onCompleted(e, { rowsAffected: 0 }));

		function onInnerCompleted(response) {
			var affectedRows = 0;

			if (response) {
				if (typeof response.changes === 'number') affectedRows = response.changes;
				else if (typeof response.meta === 'object' && response.meta && typeof response.meta.changes === 'number') {
					affectedRows = response.meta.changes;
				} else if (typeof response.affectedRows === 'number') {
					affectedRows = response.affectedRows;
				}
			}

			onCompleted(null, { rowsAffected: affectedRows });
		}
	}
}

module.exports = wrapCommand;
