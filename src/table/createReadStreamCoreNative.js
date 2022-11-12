var newQuery = require('./readStream/newQuery');
var strategyToSpan = require('./strategyToSpan');
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
var newQueryStream = require('./readStream/newQueryStream');

function createReadStreamCoreNative(table, db, filter, strategy, transformer, streamOptions) {
	var alias = table._dbName;
	filter = negotiateRawSqlFilter(filter, table);
	var span = strategyToSpan(table, strategy);

	if (process.domain)
		process.domain.add(transformer);

	db.transaction(async () => {
		await start();
	}).then(null, onError);

	function start() {
		return new Promise((resolve, reject) => {
			var query = newQuery(db, table, filter, span, alias);
			var queryStream = newQueryStream(query, streamOptions);
			queryStream.on('end', resolve);
			queryStream.on('error', onStreamError);
			queryStream.pipe(transformer);

			function onStreamError(e) {
				reject(e);
			}
		});

	}

	function onError(e) {
		transformer.emit('error', e);
	}

	return transformer;
}

module.exports = createReadStreamCoreNative;