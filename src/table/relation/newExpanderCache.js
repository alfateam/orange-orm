//todo remove ?
//unused ?
var newRowCache = require('../newRowCache');

function newExpanderCache(joinRelation) {
	return newRowCache(joinRelation.childTable);
}

module.exports = newExpanderCache;