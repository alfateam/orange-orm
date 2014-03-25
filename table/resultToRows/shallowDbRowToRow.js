var getRelatedRows = require('./getRelatedRows');

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
	setRelated();

	function setRelated() {
		var relations = table._relations;
		for(var relationName in relations) {			
			var relation = relations[relationName];
			setSingleRelated(relationName,relation);
		}	
	}

	function setSingleRelated(name, relation) {
		Object.defineProperty(row, name, {
    		get: function() {        			
       			return getRelatedRows(relation, row);
       		}
    	});
	}
	
	return row;
}

module.exports = shallowDbRowToRow;