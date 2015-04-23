var updateField = require('../updateField');
var newEmitEvent = require('../../emitEvent');
var extractStrategy = require('./toDto/extractStrategy');
var newToDto = require('./toDto/newToDto');
var extractDeleteStrategy = require('../extractDeleteStrategy');
var newCascadeDeleteStrategy = require('../newCascadeDeleteStrategy');
var _delete = require('./delete');
var newObject = require('../../newObject');

function shallowDbRowToRow(table, values) {
    if (table.shallowDbRowToRow)
        return table.shallowDbRowToRow(values);
    defineRow(table);
    return table.shallowDbRowToRow(values);
}

function defineRow(table) {

    function Row(values) {
        this._values = values;
        this._related = {};
        this._emitChanged = {};
    }

    table._columns.forEach(addColumn);

    function addColumn(column) {
        defineColumnProperty(column);
        // this._emitChanged[alias] = newEmitEvent();
    }

    function defineColumnProperty(column) {
        var name = column.alias;
        Object.defineProperty(Row.prototype, name, {
            get: function() {
                return this._values[name];
            },
            set: function(value) {
                var oldValue = this._values[name];
                value = column.purify(value);
                this._values[name] = value;
                updateField(table, column, this);
                // this._emitChanged[name](this, column, value, oldValue);
            }
        });
    }

    setRelated();

    function setRelated() {
        var relations = table._relations;
        for (var relationName in relations) {
            var relation = relations[relationName];
            setSingleRelated(relationName, relation);
        }
    }

    function setSingleRelated(name, relation) {
        Object.defineProperty(Row.prototype, name, {
            get: function() {
                return createGetRelated(this, name)();
            }
        });
    }

    function createGetRelated(row, alias) {
        var get = row._related[alias];
        if (!get) {
            var relation = table._relations[alias];
            get = relation.toGetRelated(row);
            row._related[alias] = get;
        }
        return get;
    }

    Row.prototype.subscribeChanged = function(onChanged, name) {
        // if (name) {
        //     emitChanged[name].add(onChanged);
        //     return;
        // }
        // for (name in emitChanged) {
        //     emitChanged[name].add(onChanged);
        // }
    };

    Row.prototype.unsubscribeChanged = function(onChanged, name) {
        // if (name) {
        //     emitChanged[name].tryRemove(onChanged);
        //     return;
        // }
        // for (name in emitChanged) {
        //     emitChanged[name].tryRemove(onChanged);
        // }
    };

    Row.prototype.toJSON = function(strategy) {
        return this.toDto.apply(null, arguments).then(JSON.stringify);
    };

    Row.prototype.toDto = function(strategy) {
        var args = Array.prototype.slice.call(arguments, 0);
        args.push(table);
        strategy = extractStrategy.apply(null, args);
        var toDto = newToDto(strategy, table);
        return toDto(this);
    };

    Row.prototype.expand = function(alias) {
        var get = createGetRelated(this, alias);
        get.expanded = true;
    };

    Row.prototype.isExpanded = function(alias) {
        var get = createGetRelated(this, alias);
        return get.expanded;
    };

    Row.prototype.delete = function(strategy) {
        strategy = extractDeleteStrategy(strategy, table);
        _delete(this, strategy, table);
    };

    Row.prototype.cascadeDelete = function() {
        var strategy = newCascadeDeleteStrategy(newObject(), table);
        _delete(this, strategy, table);
    };

    table.shallowDbRowToRow = function(values) {
    	return new Row(values);
    }
}

module.exports = shallowDbRowToRow;
