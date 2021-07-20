let extractSubStrategy = _extractSubStrategy;

function _extractSubStrategy(table) {
	extractSubStrategy = require('./getMeta');
	return extractSubStrategy(table);
}

function getMeta() {
	if (arguments.length === 2)
		return arguments[0];
	let table = arguments[0];
	let strategy = {keys: table._primaryColumns.map(x => ({name: x.alias, type: x.tsType}))};
	let relations = table._relations;
	let relationName;

	let visitor = {};
	visitor.visitJoin = function() {};

	visitor.visitMany = function(relation) {
		strategy[relationName] = extractSubStrategy(relation.childTable);
	};

	visitor.visitOne = visitor.visitMany;

	for (relationName in relations) {
		let relation = relations[relationName];
		relation.accept(visitor);
	}
	return strategy;
}

module.exports = getMeta;