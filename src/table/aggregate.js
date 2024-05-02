function newAggregate(table) {

	function aggregate(fn) {
		return fn(table);
	}
	return aggregate;
}

module.exports = newAggregate;