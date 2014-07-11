function newGetRelated(parent, relation) {
	
	function getRelated() {
		return relation.getRows(parent);
	}	

	return getRelated;
};

module.exports = newGetRelated;