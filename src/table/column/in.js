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

	const encode = column.encode.direct;
	const params = new Array(values.length);
	for (let i = 0; i < values.length; i++) {
		params[i] = encode(context, values[i]);
	}
	const sql = `${firstPart +  new Array(values.length).fill('?').join(',')})`;
	return newBoolean(newParameterized(sql, params));
}

module.exports = _in;