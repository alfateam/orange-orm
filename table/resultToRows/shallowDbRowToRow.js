var updateField = require('../updateField');
var newEmitEvent = require('../../emitEvent');
var extractStrategy = require('./toDto/extractStrategy');
var newToDto = require('./toDto/newToDto');
var notifyDirty = require('../notifyDirty');

function shallowDbRowToRow(table, values) {	
	var row = {};
	var columns  = {};
	var emitChanged = {};
	var getRelated = {};
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
       			notifyDirty(row);
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
    				return createGetRelated(name)();
       		}
    	});
	}

	function createGetRelated(alias) {
		var get = getRelated[alias];
    	if (!get) {
    		var relation = table._relations[alias];
    		get = relation.toGetRelated(row);
    		getRelated[alias] = get;
    	}
    	return get;
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

	row.toJSON = function(strategy) {		
		return row.toDto.apply(null,arguments).then(JSON.stringify);
	};

	row.toDto = function(strategy) {
		var args = Array.prototype.slice.call(arguments, 0);
		args.push(table);			
		strategy = extractStrategy.apply(null,args);		
		var toDto = newToDto(strategy, table);
		return toDto(row);
	};

	row.expand = function(alias) {
		var get = createGetRelated(alias);
    	get.expanded = true;
	};
	
	return row;
}

module.exports = shallowDbRowToRow;