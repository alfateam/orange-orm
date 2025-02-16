var extractParentKey = require('./extractParentKey');

function synchronizeChanged(context, manyCache, joinRelation, parent, child) {
	var columns = joinRelation.columns;
	columns.forEach(subscribeColumn);
	child = null;

	function subscribeColumn(column) {
		child.subscribeChanged(onChanged, column.alias);
	}

	function unsubscribe(child) {
		columns.forEach(unsubscribeColumn);

		function unsubscribeColumn(column) {
			child.unsubscribeChanged(onChanged, column.alias);
		}
	}

	function onChanged(child) {
		unsubscribe(child);
		manyCache.tryRemove(context, parent, child);
		var newParent = extractParentKey(joinRelation, child);
		manyCache.tryAdd(context, newParent, child);
	}



}

module.exports = synchronizeChanged;