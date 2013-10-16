var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var strategy = {
					orderLines: {
						product: null
					},
					consignee : null
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
	c.table._relations = { orderLines: orderLinesRelation, consignee: consigneeRelation };

	orderLinesRelation.childTable = orderLineTable;
	orderLineTable._relations = { product: productRelation };	

	c.newLeg.expect(orderLinesRelation).return(orderLinesLeg);
	c.newLeg.expect(productRelation).return(productLeg);
	c.newLeg.expect(consigneeRelation).return(consigneeLeg);

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
	c.newCollection.expect().return(legs);
	c.legs = legs;
	c.returned = c.sut(c.table,strategy);
}

act.base = '../req';
module.exports = act;