var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var strategy = {
					orderLines: {
						product: null,
						limit: {},
						orderBy: {}
					},
					consignee : null,
					limit: {},
					orderBy: {}
				};
var legs = {};
var productRelation = {};
var orderLinesRelation = {};
var consigneeRelation = {};
var orderLineTable = {};
var productRelation = {};
var orderLinesLeg = {};
var productLeg = {};
var consigneeLeg = {};
var orderLinesSpan = {};
var orderLinesSubLegs = {};
var productTable = {};
var addProductLeg = mock();

function act(c){
	c.queryContext = {};
	c.newQueryContext.expect().return(c.queryContext);
	c.strategy = strategy;
	c.table._relations = { orderLines: orderLinesRelation, consignee: consigneeRelation };

	orderLinesRelation.childTable = orderLineTable;
	orderLineTable._relations = { product: productRelation };	

	orderLinesRelation.toLeg = mock();
	orderLinesRelation.toLeg.expect().return(orderLinesLeg);

	productRelation.toLeg = mock();
	productRelation.toLeg.expect().return(productLeg);

	consigneeRelation.toLeg = mock();
	consigneeRelation.toLeg.expect().return(consigneeLeg);		

	orderLinesLeg.span = orderLinesSpan;
	orderLinesSpan.legs = orderLinesSubLegs;
	orderLinesSubLegs.add = addProductLeg;
	addProductLeg.expect(productLeg);
	c.addProductLeg = addProductLeg;

	productRelation.childTable = productTable;
	productLeg.span = {};	
	consigneeLeg.span = {};

	legs.add = mock();
	legs.add.expect(orderLinesLeg);
	legs.add.expect(consigneeLeg);
	c.orderLinesSpan = orderLinesLeg.span;
	c.newCollection.expect().return(legs);
	c.legs = legs;
	c.returned = c.sut(c.table,strategy);
}

act.base = '../req';
module.exports = act;