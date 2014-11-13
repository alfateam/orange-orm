var addSubStrategies = _addSubStrategies;
var newObject = require('../newObject');

function newCascadeDeleteStrategy(strategy, table) {
	var relations = table._relations;
	var relationName;

	var c = {};
	c.visitJoin = function(){};
	c.visitOne = function(relation) {
		var subStrategy = newObject();
		strategy[relationName] = subStrategy;
		addSubStrategies(subStrategy, relation.childTable);
	};

	c.visitMany = c.visitOne;

	for(relationName in relations) {
		var relation = relations[relationName];
		relation.accept(c);
	}
	return strategy;
}

function _addSubStrategies(strategy, table) {	
	addSubStrategies = require('./newCascadeDeleteStrategy');
	addSubStrategies(strategy, table);
}

module.exports = newCascadeDeleteStrategy;