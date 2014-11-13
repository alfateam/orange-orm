function newForeignKeyFilter(joinRelation, parentRow) {
    var columns = joinRelation.columns;
    var rightTable = joinRelation.childTable;

    var filter = getNextFilterPart(0);

    for (var i = 1; i < columns.length; i++) {

        filter = filter.and(getNextFilterPart(i));
    }

    function getNextFilterPart(index) {
        var column = columns[index];
        var pk = rightTable._primaryColumns[index];
        return column.eq(parentRow[pk.alias]);
    }
    return filter;
}

module.exports = newForeignKeyFilter;