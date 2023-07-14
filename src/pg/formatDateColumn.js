function formatDateColumn(column) {
	return column._dbName + '::text';
}

module.exports = formatDateColumn;