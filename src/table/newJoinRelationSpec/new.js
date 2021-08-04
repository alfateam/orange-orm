var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var expectRequire = a.expectRequire;
var parentTable = {};
var childTable = {};
var idColumn = {}, fooColumn = {}, barColumn = {};

function act(c) {
    c.mock = mock;
    c.getById = requireMock('./getById');
    c.requireMock = a.requireMock;
    
    parentTable._columns = [idColumn, fooColumn, barColumn];
    c.fooAlias = '_fooAlias'
    c.fooColumnName = 'foo';
    c.barColumnName = 'bar';
    c.barAlias = '_barAlias'
    c.idColumnName = 'id';
    c.columnNames = [c.fooColumnName, c.barColumnName];
    idColumn._dbName = c.idColumnName;
    fooColumn._dbName = c.fooColumnName;
    fooColumn.alias = c.fooAlias;
    barColumn._dbName = c.barColumnName;
    barColumn.alias = c.barAlias;
    c.childTable = childTable;
    c.parentTable = parentTable;
    c.fooColumn = fooColumn;
    c.barColumn = barColumn;
    c.newLeg = requireMock('./relation/newJoinLeg');
    c.nullPromise = requireMock('./nullPromise');

    c.newGetRelated = c.requireMock('./newGetRelated');
    c.getRelatives = requireMock('./joinRelation/getRelatives');
    c.tryGetFromCacheById = c.requireMock('./tryGetFromCacheById');
    
    
    c.sut = require('../newJoinRelation')(parentTable, childTable, c.columnNames);
}

module.exports = act;
