var log = require('../table/log');

function wrapCommand(_context, connection) {
	return runQuery;

	function runQuery(query, onCompleted) {
		try {
			var params = Array.isArray(query.parameters) ? query.parameters : [];
			var sql = query.sql();
			log.emitQuery({ sql, parameters: params });

			var statement = connection.query(sql);

			var info;
			if (params.length === 0) info = statement.run();
			else info = statement.run.apply(statement, params);

			var affectedRows = 0;
			if (info && typeof info.changes === 'number') affectedRows = info.changes;
			else if (info && typeof info.affectedRows === 'number') affectedRows = info.affectedRows;

			onCompleted(null, { affectedRows });
		}
		catch (e) {
			onCompleted(e, { affectedRows: 0 });
		}
	}
}

module.exports = wrapCommand;
