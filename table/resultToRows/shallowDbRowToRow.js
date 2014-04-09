var newEmitEvent = require('../../emitEvent');

function shallowDbRowToRow(table, values) {	
	var row = {};
	var columns = table._columns;
	var emitChanged = {};
	columns.forEach(addColumn);

	function addColumn(column) {
		var alias = column.alias;
		defineColumnProperty(alias);
		emitChanged[alias] = newEmitEvent();
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