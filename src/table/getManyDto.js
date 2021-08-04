var newQuery = require('./getManyDto/newQuery');
var strategyToSpan = require('./strategyToSpan');
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
var executeQueries = require('./executeQueries');
var getSessionContext = require('./getSessionContext');

function getManyDto(table, filter, strategy) {
	let isPg;
	let c = {};
	c.visitPg = function() {
		isPg = true;
	};
	c.visitMySql = function() {};
	c.visitSqlite = function() {};

	getSessionContext().accept(c);

	if (!isPg) {
		let args = [];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		return table.getMany.apply(null, args)
			.then((rows) => {
				args.shift();
				return rows.toDto.apply(rows, args);
			});
	}
	var alias = table._dbName;
	filter = negotiateRawSqlFilter(filter, table);
	var span = strategyToSpan(table, strategy);
	var query = newQuery(table, filter, span, alias);
	return executeQueries([query]).then(onResults).then(onSingleResult);

	function onResults(rowsPromises) {
		return rowsPromises[0];
	}

	function onSingleResult(result) {
		for (var p in result[0]) {
			let res = result[0][p];
			return res;
		}
	}

}

module.exports = getManyDto;