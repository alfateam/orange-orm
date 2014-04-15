var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.colDiscriminator1 = "fooColumn='fooDiscr'";
	c.colDiscriminator2 = "barColumn='barDiscr'";
	c.table._columnDiscriminators = [c.colDiscriminator1, c.colDiscriminator2];

	c.expected = {};
	c.part8.append = c.mock();
	c.part8.append.expect(" AND fooColumn='fooDiscr' AND barColumn='barDiscr'").return(c.expected);

	c.returned = c.sut(c.table, c.columnList, c.row);
}

module.exports = act;