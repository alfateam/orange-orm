var updateField = require('../updateField');
var newEmitEvent = require('../../emitEvent');
var extractStrategy = require('./toDto/extractStrategy');
var extractDeleteStrategy = require('../extractDeleteStrategy');
var newCascadeDeleteStrategy = require('../newCascadeDeleteStrategy');
var _delete = require('./delete');
var newObject = require('../../newObject');
var toDto = require('./toDto');

function newDecodeDbRow(table, dbRow) {
	var columns = table._columns;
	var numberOfColumns = columns.length;
	if (dbRow.offset === undefined) {
		dbRow.offset = 0;
	}

	var offset = dbRow.offset;

	var keys = Object.keys(dbRow);

	for (var i = 0; i < numberOfColumns; i++) {
		defineColumnProperty(i);
	}

	dbRow.offset += numberOfColumns;

	function defineColumnProperty(i) {
		var column = columns[i];
		var purify = column.purify;
		var name = column.alias;
		i = offset + i;
		var key = keys[i];

		Object.defineProperty(Row.prototype, name, {

			get: function() {
				return this._dbRow[key];
			},
			set: function(value) {
				var oldValue = this[name];
				value = purify(value);
				this._dbRow[key] = value;
				updateField(table, column, this);
				var emit = this._emitColumnChanged[name];
				if (emit)
					emit(this, column, value, oldValue);
				this._emitChanged(this, column, value, oldValue);
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

	function setSingleRelated(name) {
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
		var emit;
		if (name) {
			emit = this._emitColumnChanged[name] || (this._emitColumnChanged[name] = newEmitEvent());
			emit.add(onChanged);
			return;
		}
		this._emitChanged.add(onChanged);
	};

	Row.prototype.unsubscribeChanged = function(onChanged, name) {
		if (name) {
			this._emitColumnChanged[name].tryRemove(onChanged);
			return;
		}
		this._emitChanged.tryRemove(onChanged);
	};

	Row.prototype.toJSON = function() {
		return this.toDto.apply(this, arguments).then(JSON.stringify);
	};

	Row.prototype.toDto = function(strategy) {
		var args = Array.prototype.slice.call(arguments, 0);
		args.push(table);
		strategy = extractStrategy.apply(null, args);
		let p =  toDto(strategy, table, this);
		return Promise.resolve().then(() => p);
	};

	Row.prototype.__toDto = function(strategy) {
		var args = Array.prototype.slice.call(arguments, 0);
		args.push(table);
		strategy = extractStrategy.apply(null, args);
		return toDto(strategy, table, this);
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

	function decodeDbRow(row) {
		for (var i = 0; i < numberOfColumns; i++) {
			var index = offset + i;
			var key = keys[index];
			row[key] = columns[i].decode(row[key]);
		}
		return new Row(row);
	}

	function Row(dbRow) {
		this._dbRow = dbRow;
		this._related = {};
		this._emitColumnChanged = {};
		this._emitChanged = newEmitEvent();
	}

	return decodeDbRow;
}

module.exports = newDecodeDbRow;
