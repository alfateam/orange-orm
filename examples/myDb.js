var db = require('../index');
var table = db.table;
var customer = require('./customer');
var order = require('./order');

var customerOrder = order.join(customer).by('oCustomerId').as('customer');
customer.hasMany(customerOrder).as('orders');

var conString = 'postgres://postgres:postgres@localhost/test';
var db = require('../index')(conString);

module.exports = db;

