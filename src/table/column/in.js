const newParameterized = require('../query/newParameterized');
const newBoolean = require('./newBoolean');
const quote = require('../quote');

function _in(context, column,values,alias) {
	let filter;
	if (values.length === 0) {
		filter =  newParameterized('1=2');
		return newBoolean(filter);
	}
	const firstPart = `${quote(context, alias)}.${quote(context, column._dbName)} in (`;

	const encode = column.encode;
	const paramsSql = new Array(values.length);
	let paramsValues = [];
	for (let i = 0; i < values.length; i++) {
		paramsSql[i] = encode(context, values[i]);
		paramsValues = [...paramsValues, ...paramsSql[i].parameters];
	}
	const sql = `${firstPart +  paramsSql.map(x => x.sql()).join(',')})`;
	return newBoolean(newParameterized(sql, paramsValues));
}

module.exports = _in;