var fs = require('fs');

var createCustomers = 'DROP TABLE IF EXISTS _customer;CREATE TABLE _customer (cId varchar(40) PRIMARY KEY, cName varchar(40));'
var createOrders = 'DROP TABLE IF EXISTS _order;CREATE TABLE _order (oId uuid PRIMARY KEY, oCustomerId varchar(40), oStatus integer, oTax boolean, oUnits float, oRegDate timestamp with time zone, oSum numeric, oImage bytea);'
var createSql = createCustomers + createOrders;

createBuffers();
var insertCustomers = "INSERT INTO _customer VALUES ('100','Bill');INSERT INTO _customer VALUES ('200','John');";
var insertOrders =
    'INSERT INTO _order VALUES (\'58d52776-2866-4fbe-8072-cdf13370959b\',\'100\', 1, TRUE, 1.21,\'2003-04-12 04:05:06 z\',1344.23,' + buffer + ');' +
    'INSERT INTO _order VALUES (\'d51137de-8dd9-4520-a6e0-3a61ddc61a99\',\'200\', 2, FALSE, 2.23,\'2014-05-11 06:49:40.297-0200\',34.59944,' + buffer2 + ')';
var insertSql = insertCustomers + insertOrders;
var buffer;
var buffer2;

function createBuffers() {
    buffer = newBuffer([1, 2, 3]);
    buffer2 = newBuffer([4, 5]);

    function newBuffer(contents) {
        var buffer = new Buffer(contents);
        return "E'\\\\x" + buffer.toString('hex') + "'";
    }
}

var dbName = 'test';
var conString = 'postgres://postgres:postgres@localhost/' + dbName;
var table = require('../table');
var pg = require('pg.js');
var client = new pg.Client(conString);


function insert(onSuccess, onFailed) {
    client.connect(function(err) {
        if (err) {
            console.log('Error while connecting: ' + err);
            onFailed(err);
            return;
        }
        client.query(createSql + insertSql, onInserted);

        function onInserted(err, result) {
            client.end();
            if (err) {
                console.error('error running query', err);
                onFailed(err);
                return;
            }
            onSuccess();
        }
    });
}


module.exports = insert;