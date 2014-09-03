var emptyStrategy = require('../../../newObject')();

function extractDeleteStrategy(strategy) {
	if (strategy)
		return strategy;
	return emptyStrategy;
};

module.exports = extractDeleteStrategy;