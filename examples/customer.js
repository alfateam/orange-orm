var table = require('../index').table;

customer = table('_customer');
customer.primaryColumn('cId').string().as('id');
customer.column('cName').string().as('name');

module.exports = customer;