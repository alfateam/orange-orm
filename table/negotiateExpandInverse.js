function negotiateExpandInverse(parent, relation, children) {
	var joinRelation = relation.joinRelation;
	if (!joinRelation)
		return;
	var firstChild = children[0];
	if (firstChild)
		firstChild.queryContext.expand(joinRelation);
}

module.exports = negotiateExpandInverse;