function act(c){
	c.expected = "INSERT INTO theTable (fooColumn,barColumn,colName1,colName2) VALUES ('fooDiscr','barDiscr',%s,%s)";
	c.returned = c.sut(c.table);
}

module.exports = act;