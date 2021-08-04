var promise = require('promise/domains');

function negotiateNextTick(i) {
	if (i === 0)
		return;
	if (i % 1000 === 0)
		return promise.resolve();
	return;
}

module.exports = negotiateNextTick;