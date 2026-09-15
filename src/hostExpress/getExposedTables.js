function getExposedTables(tables = {}, options = {}) {
	const names = Object.keys(tables);
	const configured = names.filter(name => Object.prototype.hasOwnProperty.call(options, name));
	const exposed = Object.create(null);
	for (const name of configured.length > 0 ? configured : names)
		exposed[name] = tables[name];
	return exposed;
}

module.exports = getExposedTables;
