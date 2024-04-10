// import db from './db';
// import { json } from 'body-parser';
// import cors from 'cors';
//import express from 'express';
const init = require('./initSqlite');

const db = require('./db').sqlite('demo.db');
const { json } = require('body-parser');
const cors = require('cors');
const express = require('express');

server();

db.order.getAll({
	where: (table) => {
		return table.orderDate.notEqual(null);
	}
});

async function server() {
	await insertData(db);
	express().disable('x-powered-by')
		.use(json({ limit: '100mb' }))
		.use(cors())
		.use('/rdb', validateToken)
		.use('/rdb', db.express({
			order: {
				baseFilter: (db, req, _res) => {
					const customerId = Number.parseInt(req.headers.authorization.split(' ')[1]);
					return db.order.customerId.eq(Number.parseInt(customerId));
				}
			}
		}))
		.listen(3000, () => console.log('Example app listening on port 3000!'));
}

function validateToken(req, res, next) {
	// For demo purposes, we're just checking against existence of authorization header
	// In a real-world scenario, this would be a dangerous approach because it bypasses signature validation
	const authHeader = req.headers.authorization;
	if (authHeader) {
		return next();
	} else
		return res.status(401).json({ error: 'Authorization header missing' });
}

async function insertData(db) {
	await init(db);

	const george = await db.customer.insert({
		name: 'George',
		balance: 177,
		isActive: true
	});

	const john = await db.customer.insert({
		name: 'Harry',
		balance: 200,
		isActive: true
	});
	const date1 = new Date(2022, 0, 11, 9, 24, 47);
	const date2 = new Date(2021, 0, 11, 12, 22, 45);

	await db.order.insert([
		{
			orderDate: date1,
			customer: george,
			deliveryAddress: {
				name: 'George',
				street: 'Node street 1',
				postalCode: '7059',
				postalPlace: 'Jakobsli',
				countryCode: 'NO'
			},
			lines: [
				{
					product: 'Bicycle',
					packages: [
						{ sscc: 'aaaa' }
					]
				},
				{
					product: 'Small guitar',
					packages: [
						{ sscc: 'bbbb' }
					]
				}
			]
		},
		{
			customer: john,
			orderDate: date2,
			deliveryAddress: {
				name: 'Harry Potter',
				street: '4 Privet Drive, Little Whinging',
				postalCode: 'GU4',
				postalPlace: 'Surrey',
				countryCode: 'UK'
			},
			lines: [
				{
					product: 'Magic wand',
					packages: [
						{ sscc: '1234' }
					]
				}
			]
		}
	]);
}



