var newPrimaryKeyFilter = require('./newPrimaryKeyFilter');
var getMany = require('./getMany');
var extractStrategy = require('./tryGetFromDbById/extractStrategy');

function tryGet(context) {
	var filter = newPrimaryKeyFilter.apply(null, arguments);
	var table = arguments[1];
	var strategy = extractStrategy.apply(null, arguments);
	return getMany(context, table, filter, strategy).then(filterRows);
}

tryGet.exclusive = function tryGet(context) {
	var filter = newPrimaryKeyFilter.apply(null, arguments);
	var table = arguments[1];
	var strategy = extractStrategy.apply(null, arguments);
	return getMany.exclusive(context, table, filter, strategy).then(filterRows);


};

function filterRows(rows) {
	if (rows.length > 0)
		return rows[0];
	return null;
}

module.exports = tryGet;
