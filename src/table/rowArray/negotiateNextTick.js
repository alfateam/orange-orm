
function negotiateNextTick(i) {
	if (i === 0)
		return;
	if (i % 1000 === 0)
		return Promise.resolve();
	return;
}

module.exports = negotiateNextTick;