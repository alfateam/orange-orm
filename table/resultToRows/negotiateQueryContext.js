function negotiateQueryContext(queryContext, row) {
	if (queryContext)
		queryContext.add(row);
}

module.exports = negotiateQueryContext;