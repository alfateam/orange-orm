function newGetRelated(parent, relation) {
	function getRelated() {
		//todo
		return relation.tryGetByHeuristic(parent).then(onResult);

		function onResult(row) {
			getRelated.expanded = true;
			if (row) {
				return row; 
			}
			return relation.getFromDb(parent);
		}
		
	}

	return getRelated;
}

module.exports = newGetRelated;