function deleteContext() {
	delete process.domain.rdb;
}

module.exports = deleteContext;