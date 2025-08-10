const Ajv = require('ajv');

function defineColumn(column, table) {
	var c = {};

	c.string = function() {
		require('./column/string')(table, column);
		return c;
	};

	c.json = function() {
		require('./column/json')(column);
		return c;
	};

	c.guid = function() {
		require('./column/guid')(column);
		return c;
	};
	c.uuid = c.guid;

	c.date = function() {
		require('./column/date')(column);
		return c;
	};

	c.date = function() {
		require('./column/date')(column);
		return c;
	};

	c.dateWithTimeZone = function() {
		require('./column/dateWithTimeZone')(column);
		return c;
	};

	c.numeric = function(optionalPrecision,optionalScale) {
		require('./column/numeric')(column,optionalPrecision,optionalScale);
		return c;
	};

	c.bigint = function() {
		require('./column/bigint')(column);
		return c;
	};

	c.boolean = function() {
		require('./column/boolean')(column);
		return c;
	};

	c.binary = function() {
		require('./column/binary')(column);
		return c;
	};

	c.default = function(value) {
		column.default = value;
		return c;
	};

	c.primary = function() {
		column.isPrimary = true;
		table._primaryColumns.push(column);
		return c;
	};

	c.as = function(alias) {
		var oldAlias = column.alias;
		table._aliases.delete(oldAlias);
		table._aliases.add(alias);
		delete table[oldAlias];
		table[alias] = column;
		column.alias = alias;
		return c;
	};

	c.dbNull = function(value) {
		column.dbNull = value;
		return c;
	};

	c.serializable = function(value) {
		column.serializable = value;
		return c;
	};

	c.notNull = function() {
		column._notNull = true;
		function validate(value) {
			if (value === undefined || value === null) {
				const error =  new Error(`Column ${column.alias} cannot be null or undefined`);
				error.status = 400;
				throw error;
			}
		}

		return c.validate(validate);
	};

	c.notNullExceptInsert = function() {
		column._notNullExceptInsert = true;
		function validate(value, _row, isInsert) {
			if (isInsert)
				return;
			if (value === undefined || value === null)
				throw new Error(`Column ${column.alias} cannot be null or undefined`);
		}

		return c.validate(validate);
	};

	c.validate = function(value) {
		let previousValue = column.validate;
		if (previousValue)
			column.validate = nestedValidate;
		else
			column.validate = value;

		function nestedValidate() {
			try {
				previousValue.apply(null, arguments);
				value.apply(null, arguments);
			}
			catch (e) {
				const error = new Error(e.message || e);
				// @ts-ignore
				error.status = 400;
				throw error;
			}
		}
		return c;
	};

	c.JSONSchema = function(schema, options) {
		let previousValidate = column.validate;
		let ajv = new Ajv(options);
		let validate = ajv.compile(schema);
		column.validate = _validate;

		function _validate() {
			if (previousValidate)
				previousValidate.apply(null, arguments);
			let valid = validate.apply(null, arguments);
			if (!valid) {
				let e = new Error(`Column ${table._dbName}.${column._dbName} violates JSON Schema: ${inspect(validate.errors)}`);
				e.errors = validate.errors;
				e.status = 400;
				throw e;
			}
		}
		return c;
	};

	return c;
}

function inspect(obj) {
	return JSON.stringify(obj, null, 2);
}


module.exports = defineColumn;