function newGetRelated(parent, relation) {
    function getRelated() {
        if (getRelated.expanded)
            return relation.getFromCache(parent);
        return relation.tryGetByHeuristic(parent).then(onResult);

        function onResult(row) {
            getRelated.expanded = true;
            return relation.getFromDb(parent);
        }
    }

return getRelated;
}

module.exports = newGetRelated;
