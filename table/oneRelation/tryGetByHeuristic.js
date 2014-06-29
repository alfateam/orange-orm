var empty = require('../resultToPromise')(false);
var extractParentKey = require('../relation/manyCache/extractParentKey');
var resultToPromise = require('../resultToPromise');
var getFarRelatives = require('./getFarRelatives');

function tryGetByHeuristic(parent, relation) {
	if (!parent.queryContext)
		return empty;
	var join = relation.joinRelation;
	return getFarRelatives(parent, relation).then(expand);

	function expand(children) {
		var current = empty;
		var parentInFarRelative;
		for (var i = 0; i < children.length; i++) {
			var expandSingle = newExpandSingle(children[i]);
			current = current.then(expandSingle);	
		};

		function newExpandSingle(child) {
			return expand;
			function expand() {
				return join.getRows(child).then(onParent);
			}
		}

		function onParent(row) {
			relation.expand(row);
			parentInFarRelative = parentInFarRelative || (row == parent);
		}

		return current.then(isParentFound);

		function isParentFound() {
			return parentInFarRelative;
		}
	}

}

module.exports = tryGetByHeuristic;