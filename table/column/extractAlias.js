function extract(optionalAlias) {
	if (optionalAlias)
		return optionalAlias;
	return '_0'
}

module.exports = extract;