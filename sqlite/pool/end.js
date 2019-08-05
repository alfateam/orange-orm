var pools = require('../../pools');

function endPool(genericPool, id, done) {
	genericPool.drain().then(onDrained);

	function onDrained() {
		genericPool.clear();
		delete pools[id];
		done();
	}
}

module.exports = endPool;
