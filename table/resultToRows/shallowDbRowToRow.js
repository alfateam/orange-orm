var newEmitEvent = require('../../emitEvent');

function shallowDbRowToRow(table, dbRow) {	
	var row = {};
	var columns = table._columns;
	var emitChanged = {};
	var values = {};
	var dbValues = [];
	var i=0;
	for(var propertyName in dbRow) {
   		var column = columns[i];
		var alias = column.alias;
		var dbValue = dbRow[propertyName];
		delete dbRow[propertyName];
		values[alias] = column.decode(dbValue);
		defineColumnProperty(alias);
		emitChanged[alias] = newEmitEvent();
   		i++;
   		if(columns.length == i)
   			break;
	}

	function defineColumnProperty(name) {
		Object.defineProperty(row, name, {
    		get: function() {        			
    			return values[name];
       		},
       		set : function(value) {
       			var oldValue = values[name];
       			values[name] = value;
       			emitChanged[name](row, value, oldValue);
       		}
    	});
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
    			return relation.getRows(row);
       		}
    	});
	}

	row.subscribeChanged = function(name, onChanged) {
		emitChanged[name].add(onChanged);
	}

	row.unsubscribeChanged = function(name, onChanged) {
		emitChanged[name].tryRemove(onChanged);
	}	
	
	return row;
}

module.exports = shallowDbRowToRow;