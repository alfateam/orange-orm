function shallowDbRowToRow(table, dbRow) {	
	var row = {};
	var columns = table._columns;
	var dbValues = [];
	var i=0;
	for(var propertyName in dbRow) {
   		var column = columns[i];
		var alias = column.alias;
		var dbValue = dbRow[propertyName];
		delete dbRow[propertyName];
		row[alias] = column.decode(dbValue);
   		i++;
   		if(columns.length == i)
   			break;
	}
	return row;
}

module.exports = shallowDbRowToRow;