var table = require('../index').table;

order = table('_order');
order.primaryColumn('oId').guid().as('id');
order.column('oCustomerId').string().as('customerId');
order.column('oStatus').numeric().as('status');
order.column('oTax').boolean().as('tax');
order.column('oUnits').numeric().as('units');
order.column('oRegdate').date().as('regDate');
order.column('oSum').numeric().as('sum');
order.column('oImage').binary().as('image');

module.exports = order;