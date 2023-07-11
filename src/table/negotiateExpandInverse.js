function negotiateExpandInverse(parent, relation, children) {
	var joinRelation = relation.joinRelation;
	if (!joinRelation || !joinRelation.leftAlias)
		return;
	var firstChild = children.find(function(child) {
		return child.queryContext;
	});

	if (firstChild)
		firstChild.queryContext.expand(joinRelation);
}

module.exports = negotiateExpandInverse;