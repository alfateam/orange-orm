const newQuery = require('./getManyDto/newQuery');
const negotiateRawSqlFilter = require('../table/column/negotiateRawSqlFilter');
const strategyToSpan = require('../table/strategyToSpan');
const executeQueries = require('../table/executeQueries');

async function getManyDto(table, filter, strategy) {
	filter = negotiateRawSqlFilter(filter, table);
	if (strategy && strategy.where) {
		let arg = typeof strategy.where === 'function' ? strategy.where(table) : strategy.where;
		filter = filter.and(arg);
	}
	let span = strategyToSpan(table,strategy);
	let alias = table._dbName;

	const query = newQuery(table, filter, span, alias);
	const res =  await executeQueries([query]);
	const rows = await res[0];
	if (rows.length === 0)
		return [];
	let json = '';
	for (let i = 0; i < rows.length; i++) {
		json += rows[i]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
	}
	return JSON.parse(json);
}

module.exports = getManyDto;