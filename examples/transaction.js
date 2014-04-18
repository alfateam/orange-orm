var rdb = require('../index');
var filter = rdb.filter;
var myDb = rdb("connectionString");

//myDb.transaction(doStuff).done(onOk,onFailed);
var transaction = myDb.transaction();
transaction.then(doStuff).done(onOk,onFailed);

function doStuff() {

}

function onOk() {
	transaction.commit();
}

function onFailed(error) {
	transaction.rollback();
}

var con = myDb.connect();
//alternative
//var con = myDb();
con.transaction(doStuff).done(onConOk,onConFailed);

function onConOk() {
	con.disconnect();
}

function onConFailed(error) {
	con.disconnect();
}

