var getMany = require('./getMany');
var util = require('util');

function tryGet(table, filter, strategy) {
	strategy = setLimit(strategy);
	return getMany(table, filter, strategy).then(filterRows);
}

function filterRows(rows) {
	if (rows.length > 0)
		return rows[0];
	return null;
}

tryGet.exclusive = function(table, filter, strategy) {
	strategy = setLimit(strategy);
	return getMany.exclusive(table, filter, strategy).then(filterRows);
};

function setLimit(strategy) {
	return util._extend({ limit: 1 }, strategy);
}

module.exports = tryGet;
