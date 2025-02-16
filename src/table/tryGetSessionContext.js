function tryGetSessionContext(context) {
	if (context)
		return context.rdb;
}

module.exports = tryGetSessionContext;