//either..
//strategy, table
//or..
//table
function extractStrategy(_strategyOrTable, _optinonalTable) {
	let table;
	if (arguments.length === 2 && _strategyOrTable !== undefined)
		return arguments[0];
	else if (arguments.length === 2)
		table = arguments[1];
	else
		table = arguments[0];

	let strategy = {};
	let relations = table._relations;
	let relationName;

	let visitor = {};
	visitor.visitJoin = function() { };

	visitor.visitMany = function(relation) {
		strategy[relationName] = extractStrategy(relation.childTable);
	};

	visitor.visitOne = visitor.visitMany;

	for (relationName in relations) {
		let relation = relations[relationName];
		relation.accept(visitor);
	}
	return strategy;
}


module.exports = extractStrategy;