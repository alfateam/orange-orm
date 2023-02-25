const newQuery = require('./getManyDto/newQuery');
const negotiateRawSqlFilter = require('../table/column/negotiateRawSqlFilter');
const strategyToSpan = require('../table/strategyToSpan');
const executeQueries = require('../table/executeQueries');

async function getManyDto(table, filter, strategy) {
	filter = negotiateRawSqlFilter(filter, table);
	let span = strategyToSpan(table,strategy);
	let alias = table._dbName;

	const query = newQuery(table, filter, span, alias);
	
	const res =  await executeQueries([query]);
	return res[0];
}

module.exports = getManyDto;