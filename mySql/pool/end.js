var pools = require('../../pools');

function endPool(mysqlPool, id, done) {
	mysqlPool.end(onEnd);

	function onEnd() {
		delete pools[id];
		done.apply(null, arguments);
	}
}

module.exports = endPool;
