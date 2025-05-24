var pools = require('../../pools');

function endPool(pgPool, id, done) {
	pgPool.drain(onDrained);

	function onDrained() {
		//todo await
		pgPool.destroyAllNow();
		delete pools[id];
		done();
	}
}

module.exports = endPool;
