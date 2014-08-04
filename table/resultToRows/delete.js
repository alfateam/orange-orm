function _delete(row, strategy, table) {
	table._cache.tryRemove(row);
};

module.exports = _delete;