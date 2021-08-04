var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
    c.mock = mock;
    c.requireMock = requireMock;

    c.getSqlTemplate = c.requireMock('./insert/getSqlTemplate');
    c.newParameterized = c.requireMock('../query/newParameterized');

    c.table = {};
    c.row = {};

    c.sqlTemplate = 'INSERT INTO theTable (col1,col2,col3) VALUES (%s,%s,%s)';
    c.getSqlTemplate.expect(c.table).return(c.sqlTemplate);

    c.value1 = 'value 1';
    c.unsafeValue1 = {};
    c.encodedValue1 = {
        parameters: [c.unsafeValue1]
    };
    c.alias1 = 'alias 1';
    c.row[c.alias1] = c.value1;

    c.value2 = 'value 2';
    c.encodedValue2 = {
        sql: c.mock(),
        parameters: []
    };
    c.encodedValue2.sql.expect().return('<safeValue2>');
    c.alias2 = 'alias 2';
    c.row[c.alias2] = c.value2;

    c.value3 = 'value 3';
    c.unsafeValue3 = {};
    c.encodedValue3 = {
        parameters: [c.unsafeValue3]
    };
    c.alias3 = 'alias 3';
    c.row[c.alias3] = c.value3;


    c.column1 = {};
    c.columnName1 = 'colName1';
    c.column1._dbName = c.columnName1;
    c.column1.alias = c.alias1;
    c.column1.encode = c.mock();
    c.column1.encode.expect(c.value1).return(c.encodedValue1);

    c.column2 = {};
    c.columnName2 = 'colName2';
    c.column2._dbName = c.columnName2;
    c.column2.alias = c.alias2;
    c.column2.encode = c.mock();
    c.column2.encode.expect(c.value2).return(c.encodedValue2);

    c.column3 = {};
    c.columnName3 = 'colName3';
    c.column3._dbName = c.columnName3;
    c.column3.alias = c.alias3;
    c.column3.encode = c.mock();
    c.column3.encode.expect(c.value3).return(c.encodedValue3);

    c.table._columns = [c.column1, c.column2, c.column3];
    c.newParameterized.expect("INSERT INTO theTable (col1,col2,col3) VALUES (?,<safeValue2>,?)", [c.unsafeValue1, c.unsafeValue3]).return(c.expected);

    c.returned = require('../newInsertCommandCore')(c.table, c.row);
}

module.exports = act;
