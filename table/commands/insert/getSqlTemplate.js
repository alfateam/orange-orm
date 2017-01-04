function getSqlTemplate(table) {
	if (table._insertTemplate)
		return table._insertTemplate;
    var columnNames = [];
    var values = [];
    var sql = "INSERT INTO " + table._dbName + " (";
    addDiscriminators();
    addColumns();
    sql = sql + columnNames.join(",") + ") VALUES (" + values.join(',') + ")";
	table._insertTemplate = sql;
    return sql;

    function addDiscriminators() {
        var discriminators = table._columnDiscriminators;
        for (var i = 0; i < discriminators.length; i++) {
            var parts = discriminators[i].split("=");
            columnNames.push(parts[0]);
            values.push(parts[1]);
        }
    }

    function addColumns() {
        var columns = table._columns;
        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            columnNames.push(column._dbName);
            values.push('%s');
        }
    }
}

module.exports = getSqlTemplate;