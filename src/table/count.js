const executeQueries = require('./executeQueries');
const negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
const extractFilter = require('./query/extractFilter');
const newWhereSql = require('./query/singleQuery/newWhereSql');
const quote = require('./quote');

async function count(table, filter) {
	let alias = table._dbName;
	filter = negotiateRawSqlFilter(filter, table);
	let query = newQuery(table, filter, alias);
	let allResults = await executeQueries([query]);
	let count = await allResults[0].then((rows) => {

		const count = Number.parseInt(rows[0]._count);
		return count;
	});
	return count;
}

function newQuery(table, filter, alias) {
	filter = extractFilter(filter);
	var name = quote(table._dbName);
	alias = quote(alias);
	var whereSql = newWhereSql(table, filter, alias);

	return whereSql.prepend('select count(*) "_count" from ' + name + ' ' + alias);


}

module.exports = count;