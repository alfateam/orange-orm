function notifyDirty(row) {
	if (row.queryContext)
		row.queryContext.dirty(row);
};

module.exports = notifyDirty;