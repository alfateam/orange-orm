var updateField = require('../updateField');
var newEmitEvent = require('../../emitEvent');

function shallowDbRowToRow(table, values) {	
	var row = {};
	var columns  = {};
	var emitChanged = {};
	table._columns.forEach(addColumn);

	function addColumn(column) {
		var alias = column.alias;
		defineColumnProperty(alias);
		emitChanged[alias] = newEmitEvent();
		columns[alias] = column;
	}

	function defineColumnProperty(name) {
		Object.defineProperty(row, name, {
    		get: function() {        			
    			return values[name];
       		},
       		set : function(value) {
       			var oldValue = values[name];
       			var column = columns[name];
       			value = column.purify(value);
       			values[name] = value;
       			updateField(table, columns[name], row);
       			emitChanged[name](row, column, value, oldValue);       			
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

	row.subscribeChanged = function(onChanged, name) {
		if (name) {
			emitChanged[name].add(onChanged);
			return;
		}
		for(var name in emitChanged) {
			emitChanged[name].add(onChanged);
		};					
	}

	row.unsubscribeChanged = function(onChanged, name) {
		if (name) {
			emitChanged[name].tryRemove(onChanged);
			return;
		}
		for(var name in emitChanged) {
			emitChanged[name].tryRemove(onChanged);
		};					
	}	
	
	return row;
}

module.exports = shallowDbRowToRow;