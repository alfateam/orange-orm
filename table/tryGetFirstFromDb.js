var getMany = require('./getMany');

function tryGet(table,filter,strategy)  {
	var rows = getMany(table,filter,strategy);
	if (rows.length > 0)
		return rows[0];
	return null;
}

module.exports = tryGet;