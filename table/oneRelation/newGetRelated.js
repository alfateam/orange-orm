var isDirty = require('../isDirty');

function newGetRelated(parent, relation) {
    function getRelated() {
        if (getRelated.expanded)
            return relation.getFromCache(parent);
        if (isDirty()) {
        	return relation.getFromDb(parent).then(onFromDb);
        }
        return relation.getRelatives(parent).then(onRelatives);

        function onFromDb(rows) {
        	getRelated.expanded = true;
        	return rows;
        }

        function onRelatives() {
            getRelated.expanded = true;
            return relation.getFromCache(parent);
        }
    }

	return getRelated;
}

module.exports = newGetRelated;
