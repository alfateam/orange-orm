var removeFromCache = require('./delete/removeFromCache');	
var pushCommand = require('../commands/pushCommand');
var newDeleteCommand = require('./delete/newDeleteCommand');

function _delete(row, strategy, table) {
	removeFromCache(row, strategy, table);
	var cmd = newDeleteCommand([], row, strategy, table);
	pushCommand(cmd);
};

module.exports = _delete;