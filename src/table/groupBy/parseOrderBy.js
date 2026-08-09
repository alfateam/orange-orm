function parseOrderBy(orderBy, aliases) {
	if (!orderBy)
		return [];

	const aliasSet = aliases instanceof Set ? aliases : new Set(aliases);
	const entries = Array.isArray(orderBy) ? orderBy : [orderBy];

	return entries.map(parseEntry);

	function parseEntry(entry) {
		if (typeof entry !== 'string')
			throw new Error(`Invalid aggregate orderBy '${entry}'`);

		const value = entry.trim();
		if (aliasSet.has(value))
			return { alias: value, direction: '' };

		const match = /^(.*)\s+(asc|desc)$/i.exec(value);
		const alias = match ? match[1].trim() : value;
		if (!aliasSet.has(alias))
			throw new Error(`Unable to get aggregate result on orderBy '${entry}'`);

		return {
			alias,
			direction: ` ${match[2].toLowerCase()}`
		};
	}
}

module.exports = parseOrderBy;
