var extractParentKey = require('./extractParentKey');

function synchronizeRemoved(context, action, joinRelation) {
	var cache = joinRelation.parentTable._cache;
	cache.subscribeRemoved(context, onRemoved);

	function onRemoved(child) {
		var parent = extractParentKey(joinRelation, child);
		action(parent, child);
	}
}

module.exports = synchronizeRemoved;
