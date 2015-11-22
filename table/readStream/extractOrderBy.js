function extractOrderBy(alias, span) {
    var table = span.table;
    var dbNames = [];
    var orderBy = span.orderBy;
    if (span.orderBy) {
        for (var i = 0; i < orderBy.length; i++) {
            var name = orderBy[i];
            pushColumn(table[name]);
        }
    } else
        for (var i = 0; i < table._primaryColumns.length; i++) {
            pushColumn(table._primaryColumns[i]);
        }

    function pushColumn(column) {
        dbNames.push(alias + '.' + column._dbName);
    }

    return ' order by ' + dbNames.join(',');
}

module.exports = extractOrderBy;
