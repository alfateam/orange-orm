import { db } from './map2';

/**
 * We must ensure each relation’s `type` and `target` are literal‐typed,
 * not plain `string`. Here, we use `as const` on those fields.
 */
const schema = {
	customers: {
		columns: {
			id: 0 as number,
			name: '' as string,
			email: '' as string,
		},
		relations: {
			// A customer can have many orders
			orders: {
				type: 'hasMany'    as const,
				target: 'orders'   as const,
				fkColumn: 'customerId',
			},
			// (Optional) A customer might have one “defaultAddress”
			defaultAddress: {
				type: 'hasOne'         as const,
				target: 'deliveryAddresses' as const,
				fkColumn: 'customerId',
			},
		},
	},

	orders: {
		columns: {
			id: 0 as number,
			customerId: 0 as number,
			placedAt: new Date() as Date,
			status: '' as string,
		},
		relations: {
			// Each order references exactly one customer
			customer: {
				type: 'references' as const,
				target: 'customers'  as const,
				fkColumn: 'customerId',
			},
			// Each order has many orderLines
			lines: {
				type: 'hasMany'      as const,
				target: 'orderLines' as const,
				fkColumn: 'orderId',
			},
			// Each order has exactly one deliveryAddress
			deliveryAddress: {
				type: 'hasOne'             as const,
				target: 'deliveryAddresses' as const,
				fkColumn: 'orderId',
			},
		},
	},
	packages: {
		columns: {
			id: 0 as number,
			orderId: 0 as number,
			product: '' as string
		},
	},

	orderLines: {
		columns: {
			id: 0 as number,
			orderId: 0 as number,
			productId: 0 as number,
			quantity: 0 as number,
			price: 0 as number,
		},
		relations: {
			// Each orderLine references exactly one order
			order: {
				type: 'references' as const,
				target: 'orders'    as const,
				fkColumn: 'orderId',
			},
			packages: {
				type: 'hasMany' as const,
				target: 'packages'    as const,
				fkColumn: 'orderId',
			},
		},
	},

	deliveryAddresses: {
		columns: {
			id: 0 as number,
			orderId: 0 as number,
			customerId: 0 as number,
			street: '' as string,
			city: '' as string,
			postalCode: '' as string,
		},
		relations: {
			// This deliveryAddress references exactly one order
			order: {
				type: 'references' as const,
				target: 'orders'    as const,
				fkColumn: 'orderId',
			},
			// (Optional) This could also reference a customer
			customer: {
				type: 'references'  as const,
				target: 'customers' as const,
				fkColumn: 'customerId',
			},
		},
	},
} as const; // <-- `as const` here means every literal string stays a literal

async function exampleRelations() {
	// Now TypeScript will infer the proper literal types for each relation’s
	// `type` and `target`, so `db(schema)` no longer complains.

	const database = db(schema);

	const orders = await database.orders.getAll({
		customer: {}, // Include the customer relation
		lines: {
			packages: {},
			order: {
				customer: {},
				deliveryAddress: {}
			}
		}
	});
	orders[0].lines[0].packages[0].

		console.log('All orders with nested relations:', orders);
}

exampleRelations().catch(console.error);
