var pools = require('../../pools');

function endPool(pgPool, id, done) {
	pgPool.drain().then(onDrained);

	function onDrained() {
		pgPool.clear();
		delete pools[id];
		done();
	}
}

module.exports = endPool;
