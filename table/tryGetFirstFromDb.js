var getMany = require('./getMany');

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
	return {...strategy, ...{limit: 1}};
}

module.exports = tryGet;
