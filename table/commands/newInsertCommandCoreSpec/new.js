var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.table = {};
	c.tableName = 'theTable';
	c.table._dbName = c.tableName;

	c.row = {};
	c.value1 = 'value 1';
	c.encodedValue1 = {};
	c.alias1 = 'alias 1';
	c.row[c.alias1] = c.value1;

	c.value2 = 'value 2';
	c.encodedValue2 = {};
	c.alias2 = 'alias 2';
	c.row[c.alias2] = c.value2;

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


	c.table._columns = [c.column1, c.column2];
	c.colDiscriminator1 = "fooColumn='fooDiscr'";
	c.colDiscriminator2 = "barColumn='barDiscr'";
	c.table._columnDiscriminators = [c.colDiscriminator1, c.colDiscriminator2];

	c.part0 = {};
	c.newParameterized = requireMock('../query/newParameterized');
	c.newParameterized.expect("INSERT INTO theTable (colName1,colName2,fooColumn,barColumn) VALUES ").return(c.part0);

	c.part1 = {};
	c.part0.append = c.mock();
	c.part0.append.expect("(").return(c.part1);

	c.part2 = {};
	c.part1.append = c.mock();
	c.part1.append.expect(c.encodedValue1).return(c.part2);

	c.part3 = {};
	c.part2.append = c.mock();
	c.part2.append.expect(",").return(c.part3);

	c.part4 = {};
	c.part3.append = c.mock();
	c.part3.append.expect(c.encodedValue2).return(c.part4);

	c.part5 = {};
	c.part4.append = c.mock();
	c.part4.append.expect(",").return(c.part5);

	c.part6 = {};
	c.part5.append = c.mock();
	c.part5.append.expect("'fooDiscr'").return(c.part6);

	c.part7 = {};
	c.part6.append = c.mock();
	c.part6.append.expect(",").return(c.part7);

	c.part8 = {};
	c.part7.append = c.mock();
	c.part7.append.expect("'barDiscr'").return(c.part8);

	c.expected = {};
	c.part8.append = c.mock();
	c.part8.append.expect(")").return(c.expected);

	c.returned = require('../newInsertCommandCore')(c.table, c.row);
}

module.exports = act;