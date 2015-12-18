function act(c){
    c.sut._dbName = {};
    c.sut._primaryColumns = {};
    c.sut._columns = [];
    c.sut._columnDiscriminators = {};
    c.sut._formulaDiscriminators = {};
    c.sut._relations = {};
    c.sut._cache = {};

	c.newTable = c.requireMock('./table');
	c.expected = {};
	c.newTable.expect().return(c.expected);
	c.returned = c.sut.exclusive();
}

module.exports = act;