function deleteSessionContext(context) {
	delete context.rdb;
}

module.exports = deleteSessionContext;