var extractParentKey = require('./extractParentKey');

function synchronizeDeleted(action, joinRelation) {
	var cache = joinRelation.parentTable._cache;
	cache.subscribeDeleted(onDeleted);
	
	function onDeleted(child) {
		var parent = extractParentKey(joinRelation, child);
		action(parent, child);
	}
}

module.exports = synchronizeDeleted;
