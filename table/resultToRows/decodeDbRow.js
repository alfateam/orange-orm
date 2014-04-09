
function decodeDbRow(table, dbRow) {	
	var values = {};
	var columns = table._columns;
	var i=0;
	for(var propertyName in dbRow) {
   		var column = columns[i];
		var alias = column.alias;
		var dbValue = dbRow[propertyName];
		delete dbRow[propertyName];
		values[alias] = column.decode(dbValue);
   		i++;
   		if(columns.length == i)
   			break;
	}
	return values;

}

module.exports = decodeDbRow;