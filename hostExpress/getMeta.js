var extractSubStrategy = _extractSubStrategy;

function _extractSubStrategy(table) {
	extractSubStrategy = require('./getMeta');
	return extractSubStrategy(table);
}

function getMeta() {
	if (arguments.length === 2)
		return arguments[0];
	var table = arguments[0];
	var strategy = {keys: table._primaryColumns.map(x => x.alias)};
	var relations = table._relations;
	var relationName;

	var visitor = {};
	visitor.visitJoin = function() {};

	visitor.visitMany = function(relation) {
		strategy[relationName] = extractSubStrategy(relation.childTable);
	};

	visitor.visitOne = visitor.visitMany;

	for (relationName in relations) {
		var relation = relations[relationName];
		relation.accept(visitor);
	}
	return strategy;
}

module.exports = getMeta;