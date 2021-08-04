function newGetRelated(parent, relation) {
	function getRelated() {
		if (getRelated.expanded)
			return relation.getFromCache(parent);
		if (parent.queryContext)
			return relation.getRelatives(parent).then(onRelatives);
		return relation.getFromDb(parent).then(onFromDb);

		function onFromDb(rows) {
			getRelated.expanded = true;
			return rows;
		}

		function onRelatives() {
			return relation.getFromCache(parent);
		}
	}
	return getRelated;
}

module.exports = newGetRelated;
