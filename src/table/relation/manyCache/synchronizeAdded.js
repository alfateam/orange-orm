var extractParentKey = require('./extractParentKey');

function synchronizeAdded(context, action, joinRelation) {
	var cache = joinRelation.parentTable._cache;
	cache.subscribeAdded(context, onAdded);

	function onAdded(child) {
		var parent = extractParentKey(joinRelation, child);
		action(parent, child);
	}
}

module.exports = synchronizeAdded;
