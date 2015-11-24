var getSessionSingleton = require('../getSessionSingleton');

function newQueryStream(query, options) {
	var dbClient = getSessionSingleton('dbClient');
	return dbClient.streamQuery(query, options);
}

module.exports = newQueryStream;