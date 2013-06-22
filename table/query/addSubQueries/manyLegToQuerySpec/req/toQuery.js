var parentAlias = '_1',
	leg = {},
	filter = {};

function act(c) {
	c.returned = c.sut(parentAlias,leg,filter);
}

act.base = '../req';
module.exports = act;

/*select * from at as a where aFilter;
select * from bt as b join at as a on(b.joinCol=a.joinCol) where afilter;*/