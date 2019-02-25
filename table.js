var newColumn = require('./table/column/newColumn');
var column = require('./table/column');
var join = require('./table/join');
var hasMany = require('./table/hasMany');
var hasOne = require('./table/hasOne');
var getMany = require('./table/getMany');
var getManyDto = require('./table/getManyDto');
var getById = require('./table/getById');
var tryGetById = require('./table/tryGetById');
var tryGetFirst = require('./table/tryGetFirstFromDb');
var newCache = require('./table/newRowCache');
var newContext = require('./newObject');
var insert = require('./table/insert');
var _delete = require('./table/delete');
var cascadeDelete = require('./table/cascadeDelete');
var createReadStream = require('./table/createReadStream');
var createJSONReadStream = require('./table/createJSONReadStream');

function _new(tableName) {
    var table = newContext();
    table._dbName = tableName;
    table._primaryColumns = [];
    table._columns = [];
    table._columnDiscriminators = [];
    table._formulaDiscriminators = [];
    table._relations = {};
    table._cache = newCache(table);

    table.primaryColumn = function(columnName) {
        var columnDef = newColumn(table, columnName);
        table._primaryColumns.push(columnDef);
        return column(columnDef, table);
    };

    table.column = function(columnName) {
        var columnDef = newColumn(table, columnName);
        return column(columnDef, table);
    };

    table.join = function(relatedTable) {
        return join(table, relatedTable);
    };

    table.hasMany = function(joinRelation) {
        return hasMany(joinRelation);
    };

    table.hasOne = function(joinRelation) {
        return hasOne(joinRelation);
    };

    table.getMany = function(filter, strategy) {
        return getMany(table, filter, strategy);
    };

    table.getManyDto = function(filter, strategy) {
        return getManyDto(table, filter, strategy);
    };
    
    table.getMany.exclusive = function(filter, strategy) {
        return getMany.exclusive(table, filter, strategy);
    };

    table.tryGetFirst = function() {
        return call(tryGetFirst, arguments);
    };
    table.tryGetFirst.exclusive = function() {
        return call(tryGetFirst.exclusive, arguments);
    };

    function call(func, args) {
        var mergedArgs = [table];
        for (var i = 0; i < args.length; i++) {
            mergedArgs.push(args[i]);
        }
        return func.apply(null, mergedArgs);
    }

    table.getById = function() {
        return call(getById, arguments);
    };
    table.getById.exclusive = function() {
        return call(getById.exclusive, arguments);
    };


    table.tryGetById = function() {
        return call(tryGetById, arguments);
    };

    table.tryGetById.exclusive = function() {
        return call(tryGetById.exclusive, arguments);
    };

    table.columnDiscriminators = function() {
        for (var i = 0; i < arguments.length; i++) {
            table._columnDiscriminators.push(arguments[i]);
        }
        return table;
    };

    table.formulaDiscriminators = function() {
        for (var i = 0; i < arguments.length; i++) {
            table._formulaDiscriminators.push(arguments[i]);
        }
        return table;
    };

    table.insert = function() {
        return call(insert, arguments);
    };

    table.delete = _delete.bind(null, table);
    table.cascadeDelete = cascadeDelete.bind(null, table);

    table.createReadStream = createReadStream.bind(null, table);
    table.createJSONReadStream = createJSONReadStream.bind(null, table);
    table.exclusive = function() {
        table._exclusive = true;
        return table;
    };
    return table;
}

module.exports = _new;
