var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.columnList = {};

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

	c.pkValue1 = 'pkvalue 1';
	c.encodedPk1 = {};
	c.pkAlias1 = 'pkalias 1';
	c.row[c.pkAlias1] = c.pkValue1;

	c.pkValue2 = 'pkvalue 2';
	c.encodedPk2 = {};
	c.pkAlias2 = 'pkalias 2';
	c.row[c.pkAlias2] = c.pkValue2;

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

	c.pkColumn1 = {};
	c.pkColumnName1 = 'pk1';
	c.pkColumn1._dbName = c.pkColumnName1;
	c.pkColumn1.alias = c.pkAlias1;
	c.pkColumn1.encode = c.mock();
	c.pkColumn1.encode.expect(c.pkValue1).return(c.encodedPk1);

	c.pkColumn2 = {};
	c.pkColumnName2 = 'pk2';
	c.pkColumn2._dbName = c.pkColumnName2;
	c.pkColumn2.alias = c.pkAlias2;
	c.pkColumn2.encode = c.mock();
	c.pkColumn2.encode.expect(c.pkValue2).return(c.encodedPk2);

	c.table._primaryColumns = [c.pkColumn1, c.pkColumn2];

	c.colDiscriminator1 = "fooColumn='fooDiscr'";
	c.colDiscriminator2 = "barColumn='barDiscr'";
	c.table._columnDiscriminators = [c.colDiscriminator1, c.colDiscriminator2];

	c.columnList[c.alias1] = c.column1;
	c.columnList[c.alias2] = c.column2;

	c.part0 = {};
	c.newParameterized = requireMock('../query/newParameterized');
	c.newParameterized.expect("UPDATE theTable SET").return(c.part0);

	c.part1 = {};
	c.part0.append = c.mock();
	c.part0.append.expect(" colName1=").return(c.part1);

	c.part2 = {};
	c.part1.append = c.mock();
	c.part1.append.expect(c.encodedValue1).return(c.part2);

	c.part3 = {};
	c.part2.append = c.mock();
	c.part2.append.expect(",colName2=").return(c.part3);

	c.part4 = {};
	c.part3.append = c.mock();
	c.part3.append.expect(c.encodedValue2).return(c.part4);

	c.part5 = {};
	c.part4.append = c.mock();
	c.part4.append.expect(" WHERE pk1=").return(c.part5);

	c.part6 = {};
	c.part5.append = c.mock();
	c.part5.append.expect(c.encodedPk1).return(c.part6);

	c.part7 = {};
	c.part6.append = c.mock();
	c.part6.append.expect(" AND pk2=").return(c.part7);

	c.part8 = {};
	c.part7.append = c.mock();
	c.part7.append.expect(c.encodedPk2).return(c.part8);

	c.expected = {};
	c.part8.append = c.mock();
	c.part8.append.expect(" AND fooColumn='fooDiscr' AND barColumn='barDiscr'").return(c.expected);

	c.returned = require('../newUpdateCommandCore')(c.table, c.columnList, c.row);
}

module.exports = act;