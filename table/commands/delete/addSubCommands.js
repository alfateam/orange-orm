var legToQuery = _manyLegToQuery;

function addSubQueries(queries,table,filter,span,alias,innerJoin) {	
	var c = {};
	var _legNo;
	c.visitJoin = function() {};	
	c.visitMany = function(leg) {
		legToQuery(queries, alias,leg,_legNo,filter,innerJoin);
	};
	c.visitOne = c.visitMany;

	span.legs.forEach(onEachLeg);	

	function onEachLeg(leg,legNo) {
		_legNo = legNo;
		leg.accept(c);
	}
}

function _manyLegToQuery() {
	legToQuery = require('./addSubCommands/legToQuery');	
	return legToQuery.apply(null,arguments);
}


// module.exports = addSubQueries;

// delete from _customer _0 where _0.cId='87654321-0000-0000-0000-000000000000'


// delete from _orderLine _0_0_0 
// INNER JOIN _order _0_0 ON (_0_0_0.lOrderId=_0_0.oId) 
// INNER JOIN _customer _0 ON (_0_0.oCustomerId=_0.cId) where _0.cId='87654399-0000

// delete from _orderLine _0_0_0 
// where (exists (select _order _0_0 INNER JOIN _customer _0 ON (_0_0.oCustomerId=_0.cId) where _0_0_0.lOrderId=_0_0.oId))
// and _0.cId='87654399-0000

// delete from _order _0_0 
// where (exists (select 1 from_customer _0 where _0.cId='87654399-0000' and _0_0.oCustomerId=_0.cId))



// delete from _orderLine _0_0_0 

// INNER JOIN _customer _0 ON (_0_0.oCustomerId=_0.cId) 
// where (exists (SELECT 1 FROM _customer _0 INNER JOIN _order _0_0 ON (_0_0_0.lOrderId=_0_0.oId)  where _0.cId='87654321-0000-0000-0000-000000000000' 