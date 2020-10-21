let updateField = require('../updateField');
let newEmitEvent = require('../../emitEvent');
let extractStrategy = require('./toDto/extractStrategy');
let extractDeleteStrategy = require('../extractDeleteStrategy');
let newCascadeDeleteStrategy = require('../newCascadeDeleteStrategy');
let _delete = require('./delete');
let newObject = require('../../newObject');
let toDto = require('./toDto');
let createDto = require('./toDto/createDto');
let patchRow = require('../../patchRow');

function newDecodeDbRow(table, dbRow) {
	let columns = table._columns;
	let numberOfColumns = columns.length;
	if (dbRow.offset === undefined) {
		dbRow.offset = 0;
	}

	let offset = dbRow.offset;

	let keys = Object.keys(dbRow);

	for (let i = 0; i < numberOfColumns; i++) {
		defineColumnProperty(i);
	}

	dbRow.offset += numberOfColumns;

	function defineColumnProperty(i) {
		let column = columns[i];
		let purify = column.purify;
		let name = column.alias;
		i = offset + i;
		let key = keys[i];

		Object.defineProperty(Row.prototype, name, {

			get: function() {
				return this._dbRow[key];
			},
			set: function(value) {
				let oldValue = this[name];
				value = purify(value);
				this._dbRow[key] = value;
				if (column.validate)
					column.validate(value, this._dbRow);
				updateField(table, column, this);
				let emit = this._emitColumnChanged[name];
				if (emit)
					emit(this, column, value, oldValue);
				this._emitChanged(this, column, value, oldValue);
			}
		});
	}

	setRelated();

	function setRelated() {
		let relations = table._relations;
		for (let relationName in relations) {
			let relation = relations[relationName];
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
		let get = row._related[alias];
		if (!get) {
			let relation = table._relations[alias];
			get = relation.toGetRelated(row);
			row._related[alias] = get;
		}
		return get;
	}

	Row.prototype.subscribeChanged = function(onChanged, name) {
		let emit;
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
		let args = Array.prototype.slice.call(arguments, 0);
		args.push(table);
		strategy = extractStrategy.apply(null, args);
		let p =  toDto(strategy, table, this);
		return Promise.resolve().then(() => p);
	};

	Row.prototype.__toDto = function(strategy) {
		let args = Array.prototype.slice.call(arguments, 0);
		args.push(table);
		strategy = extractStrategy.apply(null, args);
		return toDto(strategy, table, this);
	};

	Row.prototype.expand = function(alias) {
		let get = createGetRelated(this, alias);
		get.expanded = true;
	};

	Row.prototype.isExpanded = function(alias) {
		let get = createGetRelated(this, alias);
		return get.expanded;
	};

	Row.prototype.delete = function(strategy) {
		strategy = extractDeleteStrategy(strategy, table);
		_delete(this, strategy, table);
	};

	Row.prototype.cascadeDelete = function() {
		let strategy = newCascadeDeleteStrategy(newObject(), table);
		_delete(this, strategy, table);
	};

	Row.prototype.patch = async function(patches, options) {
		await patchRow(table, this, patches, options);
		return this;
	};

	function decodeDbRow(row) {
		for (let i = 0; i < numberOfColumns; i++) {
			let index = offset + i;
			let key = keys[index];
			row[key] = columns[i].decode(row[key]);
		}
		return new Row(row);
	}

	function Row(dbRow) {
		this._dbRow = dbRow;
		this._oldValues =  JSON.stringify(createDto(table, this));
		this._related = {};
		this._emitColumnChanged = {};
		this._emitChanged = newEmitEvent();
	}

	return decodeDbRow;
}

module.exports = newDecodeDbRow;
