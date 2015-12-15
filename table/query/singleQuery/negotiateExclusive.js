function negotiateExclusive(table) {
	if (table._exclusive)
		return ' FOR UPDATE';
	return '';
}

module.exports = negotiateExclusive;