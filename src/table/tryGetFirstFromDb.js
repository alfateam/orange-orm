var getMany = require('./getMany');

function tryGet(context, table, filter, strategy) {
	strategy = setLimit(strategy);
	return getMany(context, table, filter, strategy).then(filterRows);
}

function filterRows(rows) {
	if (rows.length > 0)
		return rows[0];
	return null;
}

tryGet.exclusive = function(context, table, filter, strategy) {
	strategy = setLimit(strategy);
	return getMany.exclusive(context, table, filter, strategy).then(filterRows);
};

function setLimit(strategy) {
	return {...strategy, ...{limit: 1}};
}

module.exports = tryGet;
