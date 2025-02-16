function newAggregate(table) {

	function aggregate(_context, fn) {
		return fn(table);
	}
	return aggregate;
}

module.exports = newAggregate;