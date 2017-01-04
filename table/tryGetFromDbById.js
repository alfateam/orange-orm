var newPrimaryKeyFilter = require('./newPrimaryKeyFilter');
var tryGetFirstFromDb = require('./tryGetFirstFromDb');
var extractStrategy = require('./tryGetFromDbById/extractStrategy');

function tryGet() {
    var filter = newPrimaryKeyFilter.apply(null, arguments);
    var table = arguments[0];
    var strategy = extractStrategy.apply(null, arguments);
    return tryGetFirstFromDb(table, filter, strategy);
}

tryGet.exclusive = function tryGet() {
    var filter = newPrimaryKeyFilter.apply(null, arguments);
    var table = arguments[0];
    var strategy = extractStrategy.apply(null, arguments);
    return tryGetFirstFromDb.exclusive(table, filter, strategy);
}

module.exports = tryGet;
