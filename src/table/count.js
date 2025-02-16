const executeQueries = require('./executeQueries');
const negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
const extractFilter = require('./query/extractFilter');
const newWhereSql = require('./query/singleQuery/newWhereSql');
const quote = require('./quote');

async function count(context, table, filter) {
	let alias = table._dbName;
	filter = negotiateRawSqlFilter(context,filter, table);
	let query = newQuery(context, table, filter, alias);
	let allResults = await executeQueries(context, [query]);
	let count = await allResults[0].then((rows) => {

		const count = Number.parseInt(rows[0]._count);
		return count;
	});
	return count;
}

function newQuery(context, table, filter, alias) {
	filter = extractFilter(filter);
	var name = quote(context, table._dbName);
	alias = quote(context, alias);
	var whereSql = newWhereSql(context, table, filter, alias);

	return whereSql.prepend('select count(*) "_count" from ' + name + ' ' + alias);


}

module.exports = count;