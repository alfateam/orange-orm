var sql = 'CREATE TABLE _order (oId varchar(40) PRIMARY KEY, oCustomerId varchar(40), oStatus integer)'

var table = require('./table');
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
 	domain.dbClient.query('DELETE FROM _order;INSERT INTO _order VALUES (\'1\',\'100\', 1);INSERT INTO _order VALUES (\'2\',\'200\', 2)', onInserted);
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
	order.primaryColumn('oId').string().as('id');
	order.column('oCustomerId').string().as('customerId');
	order.column('oStatus').integer().as('status');			
}		

function getOrders() {
	order.getMany().then(onOrders).done(onOk,onFailed);
}

function onOrders (rows) {	
	for (var i in rows) {
		var row  = rows[i];
		console.log('id: %s, customerId: %s, status: %s',row.id,row.customerId, row.status);
	};
}

function onOk() {
	domain.done();
}

function onFailed(err) {
	domain.done();
	console.log('failed: ' + err);
	console.log('stack: ' + err.stack);
}