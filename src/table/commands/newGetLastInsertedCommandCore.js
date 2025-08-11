const newParameterized = require('../query/newParameterized');
const getSessionContext = require('../getSessionContext');
const newDiscriminatorSql = require('../query/singleQuery/newDiscriminatorSql');
const quote = require('../quote');

function newGetLastInsertedCommandCore(context, table, row) {
	let parameters = [];
	let keyValues = table._primaryColumns.map(column => row['__' + column.alias]);
	let sql = `SELECT ${columnNames()} FROM ${quote(context, table._dbName)} WHERE ${whereSql()}`;
	return newParameterized(sql, parameters);

	function columnNames() {
		return table._columns.map(formatColumn).join(',');
	}

	function formatColumn(column) {
		const formatted = column.formatOut ? column.formatOut(context)  + ' as ' + quote(context, column._dbName) :  quote(context, column._dbName);
		if (column.dbNull === null)
			return formatted;
		else {
			const encoded = column.encode.unsafe(context, column.dbNull);
			return `CASE WHEN ${formatted}=${encoded} THEN null ELSE ${formatted} END`;
		}
	}

	function whereSql() {
		let parameterized;
		let filter = getSessionContext(context).lastInsertedSql(context, table, keyValues);
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				const sep = i === 0 ? '' : ' AND ';
				if (!filter[i].sql) {
					const sql = filter[i];
					filter[i] = {sql : () => sql};
				}
				let next = newParameterized(sep + filter[i].sql(), filter[i].parameters);
				if (parameterized)
					parameterized = parameterized.append(next);
				else
					parameterized = next;
			}
		}
		else
			parameterized = newParameterized(filter);
		parameters = parameters.concat(parameterized.parameters);
		return [discriminators(), parameterized.sql()].filter(x => x).join(' AND ');
	}

	function discriminators() {
		return newDiscriminatorSql(context, table, table._dbName);
	}
}

module.exports = newGetLastInsertedCommandCore;