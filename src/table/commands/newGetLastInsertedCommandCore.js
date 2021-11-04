let newParameterized = require('../query/newParameterized');
let getSessionContext = require('../getSessionContext');

function newGetLastInsertedCommandCore(table, row) {
	let parameters = [];
	let keyValues = table._primaryColumns.map(column => row['__' + column.alias]);
	let sql = `SELECT ${columnNames()} FROM ${table._dbName} WHERE ${whereSql()}`;
	return newParameterized(sql, parameters);

	function columnNames() {
		return table._columns.map(col => col._dbName).join(',');
	}

	function whereSql() {
		let parameterized;
		let filter = getSessionContext().lastInsertedSql(table, keyValues);
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				const sep = i === 0 ? '' : ' AND ';
				if (!filter[i].sql)
					filter[i] = {sql : () => filter[i]};
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
		return [discriminators(), parameterized.sql()].filter(x => x).join(',');
	}

	function discriminators() {
		return table._columnDiscriminators.join(',');
	}
}

module.exports = newGetLastInsertedCommandCore;