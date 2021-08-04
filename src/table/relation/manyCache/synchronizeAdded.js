var extractParentKey = require('./extractParentKey');

function synchronizeAdded(action, joinRelation) {
	var cache = joinRelation.parentTable._cache;
	cache.subscribeAdded(onAdded);

	function onAdded(child) {
		var parent = extractParentKey(joinRelation, child);
		action(parent, child);
	}
}

module.exports = synchronizeAdded;
