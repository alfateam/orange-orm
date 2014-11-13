function extractParentKey(joinRelation, child) {

    var childTable = joinRelation.childTable;
    var primaryColumns = childTable._primaryColumns;
    var parent = {};

    joinRelation.columns.forEach(addKeyToParent);

    function addKeyToParent(childPk, index) {
        var primaryColumn = primaryColumns[index];
        parent[primaryColumn.alias] = child[childPk.alias];
    }

    return parent;
}

module.exports = extractParentKey;