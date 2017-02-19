function cloneStrategy(strategy, target = {}) {
    for (var name in strategy) {
        target[name] = mapChild(strategy[name]);            
    }
    return target;
}

function mapChild(strategy) {
	if (strategy instanceof Array)
		return cloneStrategy(strategy, []);
	if (strategy instanceof Object) {
		return cloneStrategy(strategy, {});
	}
	return strategy;
}

module.exports = cloneStrategy;