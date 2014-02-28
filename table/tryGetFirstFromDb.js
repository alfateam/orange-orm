var getMany = require('./getMany');

function tryGet(table,filter,strategy)  {	
	var rowsPromise = getMany(table,filter,strategy);
	return rowsPromise.then(filterRows);
	
	function filterRows(rows) {
		if (rows.length > 0)
			return rows[0];
		return null;
	}
}

module.exports = tryGet;