let util = require('util');
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
let onChange = require('@lroal/on-change');
let flags = require('../../flags');
let tryGetSessionContext = require('../tryGetSessionContext');
let purifyStrategy = require('../purifyStrategy');


function newDecodeDbRow(table, dbRow, filteredAliases, shouldValidate, isInsert) {
	let aliases = filteredAliases || table._aliases;
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
		let intName = '__' + name;
		i = offset + i;
		let key = keys[i];

		Object.defineProperty(Row.prototype, intName, {
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

		Object.defineProperty(Row.prototype, name, {
			enumerable: true,
			configurable: false,

			get: function() {
				if (column.onChange && flags.useProxy && (this[intName] !== null && this[intName] !== undefined) && typeof this[intName] === 'object') {
					if (!(name in this._proxies)) {
						let value = this[intName];
						this._proxies[name] = column.onChange(this._dbRow[key], () => {
							if(this[intName] !== onChange.target(value)) {
								return;
							}
							this[intName] = this._dbRow[key];
						});
					}
					return this._proxies[name];
				}
				return  negotiateNull(this[intName]);
			},
			set: function(value) {
				if (column.onChange && (this[intName] !== null && this[intName] !== undefined) && typeof value === 'object') {
					if(this[intName] === onChange.target(value))
						return;
					this._proxies[name] = column.onChange(value, () => {
						if(this[intName] !== onChange.target(value))
							return;
						this[intName] = this._dbRow[key];
					});
				}
				this[intName] = value;
			}
		});
	}

	setRelated();

	function setRelated() {
		let relations = table._relations;
		for (let relationName in relations) {
			setSingleRelated(relationName);
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
			row._relationCacheMap.set(relation, relation.getInnerCache());
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
		return toDto(undefined, table, this, new Set());
	};


	Row.prototype.hydrate = function(dbRow) {
		let i = offset;
		for(let p in dbRow) {
			let key = keys[i];
			if (this._dbRow[key] === undefined)
				this._dbRow[key] = columns[i].decode(dbRow[p]);
			i++;
		}
	};

	Row.prototype.toDto = function(strategy) {
		if (strategy === undefined) {
			strategy = extractStrategy(table);
		}
		strategy = purifyStrategy(table, strategy);
		if (!tryGetSessionContext()) {
			return toDto(strategy, table, this, new Set());
		}
		let p =  toDto(strategy, table, this);
		return Promise.resolve().then(() => p);
	};

	Row.prototype.expand = function(alias) {
		let get = createGetRelated(this, alias);
		get.expanded = true;
	};

	Row.prototype.isExpanded = function(alias) {
		return this._related[alias] && this._related[alias].expanded;
	};

	Row.prototype.delete = function(strategy) {
		strategy = extractDeleteStrategy(strategy);
		_delete(this, strategy, table);
	};

	Row.prototype.cascadeDelete = function() {
		let strategy = newCascadeDeleteStrategy(newObject(), table);
		_delete(this, strategy, table);
	};

	Row.prototype.deleteCascade = Row.prototype.cascadeDelete;

	Row.prototype.patch = async function(patches, options) {
		await patchRow(table, this, patches, options);
		return this;
	};


	Row.prototype[util.inspect.custom] =  function() {
		let dtos = toDto(undefined, table, this, new Set());
		return util.inspect(dtos, {compact: false, colors: true});
	};

	function decodeDbRow(row) {
		for (let i = 0; i < numberOfColumns; i++) {
			let index = offset + i;
			let key = keys[index];
			if (row[key] !== undefined)
				row[key] = columns[i].decode(row[key]);
			if (shouldValidate && columns[i].validate)
				columns[i].validate(row[key], row, isInsert);
		}
		let target = new Row(row);
		const p = new Proxy(target, {
			ownKeys: function() {
				return Array.from(aliases).concat( Object.keys(target._related).filter(alias => {
					return target._related[alias] && target._related[alias].expanded;
				}));
			},
			getOwnPropertyDescriptor(target, prop) {
				if (table._aliases.has(prop) || (target._related[prop]))
					return {
						enumerable: aliases.has(prop) || (target._related[prop] && target._related[prop].expanded),
						configurable: true,
						writable: true
					};
			}
		});

		return p;
	}

	function negotiateNull(value) {
		if (value === undefined)
			return null;
		return value;
	}

	function Row(dbRow) {
		this._relationCacheMap = new Map();
		this._cache = table._cache.getInnerCache();
		this._dbRow = dbRow;
		this._related = {};
		this._emitColumnChanged = {};
		this._emitChanged = newEmitEvent();
		this._proxies = {};
		this._oldValues =  JSON.stringify(createDto(table, this));
	}

	return decodeDbRow;
}

module.exports = newDecodeDbRow;
