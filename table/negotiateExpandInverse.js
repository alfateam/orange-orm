function negotiateExpandInverse(parent, relation, children) {
	var joinRelation = relation.joinRelation;
	if (!joinRelation)
		return;
	var firstChild = children.find(function(child) {
		return child.queryContext;
	});

	if (firstChild)
		firstChild.queryContext.expand(joinRelation);
}

module.exports = negotiateExpandInverse;