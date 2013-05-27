function act(c) {
	var compositeQuery = {},
	table = {},
	filter = {};
	span = {};
	c.returned = c.sut(compositeQuery,table,filter,span);
}