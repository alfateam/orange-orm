var createSql = 'DROP TABLE _order;CREATE TABLE _order (oId uuid PRIMARY KEY, oCustomerId varchar(40), oStatus integer, oTax boolean, oUnits float, oRegDate timestamp with time zone, oSum numeric);';
var insertSql = 'DELETE FROM _order;' + 
				'INSERT INTO _order VALUES (\'58d52776-2866-4fbe-8072-cdf13370959b\',\'100\', 1, TRUE, 1.21,\'Fri Mar 07 2014 10:57:07 GMT+01\',1344.23);' + 
				'INSERT INTO _order VALUES (\'d51137de-8dd9-4520-a6e0-3a61ddc61a99\',\'200\', 2, FALSE, 2.23,\'Fri Mar 07 2015 08:25:07 GMT+02\',34.59944)';

var table = require('../table');
var pg = require('pg');
var order;
var Domain = require('domain');
var domain = Domain.create();

var dbName = 'test';
var conStringPri = 'postgres://postgres:postgres@localhost/postgres';
var conString = 'postgres://postgres:postgres@localhost/' + dbName;

defineDb();
domain.run(onRun);

function onRun() {
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
 	domain.dbClient.query(createSql + insertSql, onInserted);
}

function onInserted(err, result) {    
    if(err) {
      console.error('error running query', err);
      throw err;
    }    
    getOrders();
 };


function defineDb() {
	defineOrder();
}

function defineOrder() {
	order = table('_order');
	order.primaryColumn('oId').guid().as('id');
	order.column('oCustomerId').string().as('customerId');
	order.column('oStatus').integer().as('status');
	order.column('oTax').boolean().as('tax');
	order.column('oUnits').float().as('units');
	order.column('oRegdate').date().as('regDate');
	order.column('oSum').numeric().as('sum');
}		

function getOrders() {
	order.getMany().then(onOrders).then(getById).done(onOk,onFailed);
}


function getById() {
	return order.getById('58d52776-2866-4fbe-8072-cdf13370959b').then(printRow);		
}

function printRow(row) {
	console.log('id: %s, customerId: %s, status: %s, tax: %s, units: %s, regDate: %s, sum: %s',row.id,row.customerId, row.status, row.tax, row.units,row.regDate,row.sum);
}


function onOrders (rows) {	
	for (var i in rows) {
		printRow(rows[i]);
	};
}

function onOk() {
	pg = null;	
	domain.done();
}

function onFailed(err) {
	domain.done();
	console.log('failed: ' + err);
	console.log('stack: ' + err.stack);
}