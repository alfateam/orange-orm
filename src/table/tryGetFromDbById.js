var newPrimaryKeyFilter = require('./newPrimaryKeyFilter');
var tryGetFirstFromDb = require('./tryGetFirstFromDb');
var extractStrategy = require('./tryGetFromDbById/extractStrategy');

function tryGet(context) {
	var filter = newPrimaryKeyFilter.apply(null, arguments);
	var table = arguments[1];
	var strategy = extractStrategy.apply(null, arguments);
	return tryGetFirstFromDb(context, table, filter, strategy);
}

tryGet.exclusive = function tryGet(context) {
	var filter = newPrimaryKeyFilter.apply(null, arguments);
	var table = arguments[1];
	var strategy = extractStrategy.apply(null, arguments);
	return tryGetFirstFromDb.exclusive(context, table, filter, strategy);


};

module.exports = tryGet;
