var commitCommand = require('./commands/commitCommand');
var pushCommand = require('./commands/pushCommand');
var executeChanges = require('./executeQueries/executeChanges');
var releaseDbClient = require('./releaseDbClient');
var popChanges = require('./popChanges');

function commit(result) {
	pushCommand(commitCommand);
	var changes = popChanges();
	return executeChanges(changes)
		.then(releaseDbClient)
		.then(onReleased)

	function onReleased() {
		return result;
	}
}

module.exports = function(result) {
    return new Promise((resolve, reject) =>  {
        commit(result).then(resolve, reject);
    })
};
