var getSessionSingleton = require('../getSessionSingleton');

function newQueryStream(query) {
	var dbClient = getSessionSingleton('dbClient');
	return dbClient.streamQuery(query);
}

module.exports = newQueryStream;