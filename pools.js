var pools = require('./newObject')();

Object.defineProperty(pools, 'end', {
    enumerable: false,
    value: end
});

function end() {
    var all = [];
    for (var poolId in pools) {
    	var endPool = pools[poolId].end();
    	all.push(endPool);
    }
    return Promise.all(all);
}

module.exports = pools;
