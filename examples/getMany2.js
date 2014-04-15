var fs =require('fs');

var createCustomer = 'DROP TABLE IF EXISTS _customer;CREATE TABLE _customer (cId varchar(40) PRIMARY KEY, cName varchar(40));'
var createOrder = 'DROP TABLE IF EXISTS _order;CREATE TABLE _order (oId uuid PRIMARY KEY, oCustomerId varchar(40), oStatus integer, oTax boolean, oUnits float, oRegDate timestamp with time zone, oSum numeric, oImage bytea);'
var createSql = createCustomer + createOrder;

createBuffers();
var insertCustomer = "INSERT INTO _customer VALUES ('100','Bill');INSERT INTO _customer VALUES ('200','John');";
var insertOrder = 
				'INSERT INTO _order VALUES (\'58d52776-2866-4fbe-8072-cdf13370959b\',\'100\', 1, TRUE, 1.21,\'Fri Mar 07 2014 10:57:07 GMT+01\',1344.23,' + buffer + ');' + 
				'INSERT INTO _order VALUES (\'d51137de-8dd9-4520-a6e0-3a61ddc61a99\',\'200\', 2, FALSE, 2.23,\'Fri Mar 07 2015 08:25:07 GMT+02\',34.59944,' + buffer2 + ')';
var insertSql = insertCustomer + insertOrder;
var buffer;
var buffer2;

function createBuffers() {
	buffer = newBuffer([1,2,3]);
	buffer2 = newBuffer([4,5]);	

	function newBuffer(contents) {
		var buffer = new Buffer(contents);
		return "E'\\\\x" + buffer.toString('hex') + "'";	
	}
}

var table = require('../table');
var newChangeSet = require('../newChangeSet');
var pg = require('pg.js');
var promise = require('../table/promise');
var Order, Customer;
var strategy = {orders: null};
//var strategy;
var filter;
var Domain = require('domain');
var domain = Domain.create();

var dbName = 'test';
var conStringPri = 'postgres://postgres:postgres@localhost/postgres';
var conString = 'postgres://postgres:postgres@localhost/' + dbName;

defineDb();
domain.run(onRun);

function onRun() {
	newChangeSet();
	pg.connect(conString, function(err, client, done) { 
    if (err) {
        console.log('Error while connecting: ' + err);  
        done();
        return;       	    	
    }
	domain.dbClient = client;
    domain.done = done;    
    runDbTest();
	});
}

function runDbTest() {	
 	domain.dbClient.query(createSql + insertSql,onInserted);
}

function onInserted(err, result) {    
    if(err) {
      console.error('error running query', err);
      throw err;
    }    
    getOrders();
 };


function defineDb() {
	defineCustomer();
	defineOrder();
}

function defineCustomer() {
	Customer = table('_customer');		
	Customer.primaryColumn('cId').string().as('id');
	Customer.column('cName').string().as('name');
}

function defineOrder() {
	Order = table('_order');
	Order.primaryColumn('oId').guid().as('id');
	Order.column('oCustomerId').string().as('customerId');
	Order.column('oStatus').numeric().as('status');
	Order.column('oTax').boolean().as('tax');
	Order.column('oUnits').numeric().as('units');
	Order.column('oRegdate').date().as('regDate');
	Order.column('oSum').numeric().as('sum');
	Order.column('oImage').binary().as('image');
	var customerOrder = Order.join(Customer).by('oCustomerId').as('customer');
	Customer.hasMany(customerOrder).as('orders');
}		

function getOrders() {
	//Order.getMany(filter, strategy).then(onOrders).done(onOk,onFailed);
	//Customer.getMany(filter).then(onCustomers).done(onOk,onFailed);	
	Customer.getMany(filter,strategy).then(onCustomers).done(onOk,onFailed);	
	//Customer.getMany(filter,strategy).then(onCustomers).done(onOk,onFailed);	
}

function onCustomers(customers) {
	console.log(customers.length);
	var all = [];
	for (var i = 0; i < customers.length; i++) {
		printCustomer(customers[i]);
		all.push(customers[i].orders.then(onOrders));
	};
	return promise.all(all);
}


function getById() {
	return Order.getById('58d52776-2866-4fbe-8072-cdf13370959b').then(printOrder);		
}

function printOrder(order) {
	var image = order.image;	
	console.log('id: %s, customerId: %s, status: %s, tax: %s, units: %s, regDate: %s, sum: %s, image: %s',order.id,order.customerId, order.status, order.tax, order.units,order.regDate,order.sum,order.image.toJSON());
}

function printCustomer(customer) {
	console.log('customerId: %s, customerName: %s',customer.id,customer.name);	
}

function onOrders (orders) {	
	console.log('Number of orders: ' + orders.length);
	var all = [];
	for (var i in orders) {		
		var order = orders[i]; 
		printOrder(order);
		var customer = order.customer.then(printCustomer);
		all.push(customer);		
	};

	return promise.all(all);
}

function onOk() {
	pg = null;
	domain.done();
	console.log('done');
}

function onFailed(err) {
	domain.done();
	console.log('failed: ' + err);
	console.log('stack: ' + err.stack);
}