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
    
    parentTable._columns = [idColumn, fooColumn, barColumn];
        
    c.fooColumnName = 'foo';
    c.barColumnName = 'bar';
    c.idColumnName = 'id';
    c.columnNames = [c.fooColumnName, c.barColumnName];
    idColumn._dbName = c.idColumnName;
    fooColumn._dbName = c.fooColumnName;
    barColumn._dbName = c.barColumnName;
    c.childTable = childTable;
    c.parentTable = parentTable;
    c.fooColumn = fooColumn;
    c.barColumn = barColumn;
    c.newLeg = requireMock('./relation/newJoinLeg');
    c.sut = require('../newJoinRelation')(parentTable, childTable, c.columnNames);
}

module.exports = act;
