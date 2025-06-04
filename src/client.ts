// client.ts

import { db } from './map2';

/**
 * 1) Define a schema where `orderLines` has:
 *     • a composite PK: ['orderId','productId']
 *     • a hasMany → `packages` (packages also have a composite PK)
 */
const schema = {
	customers: {
		columns: {
			id: 0 as number,
			name: '' as string,
			email: '' as string,
		},
		primaryKey: ['id'] as const,
		relations: {
			orders: {
				type: 'hasMany'          as const,
				target: 'orders'         as const,
				fkColumns: ['customerId'] as const,
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
		primaryKey: ['id'] as const,
		relations: {
			customer: {
				type: 'references' as const,
				target: 'customers'  as const,
				fkColumns: ['customerId'] as const,
			},
			lines: {
				type: 'hasMany'        as const,
				target: 'orderLines'   as const,
				fkColumns: ['orderId'] as const,
			},
		},
	},

	orderLines: {
		columns: {
			orderId: 0 as number,
			productId: 0 as number,
			quantity: 0 as number,
			price: 0 as number,
		},
		// Composite PK: orderId + productId
		primaryKey: ['orderId', 'productId'] as const,
		relations: {
			order: {
				type: 'references' as const,
				target: 'orders'    as const,
				fkColumns: ['orderId'] as const,
			},
			// “orderLines” hasMany “packages” (each package belongs to one orderLine)
			packages: {
				type: 'hasMany'          as const,
				target: 'packages'       as const,
				fkColumns: ['orderId', 'productId'] as const,
			},
		},
	},

	packages: {
		columns: {
			orderId: 0 as number,
			productId: 0 as number,
			packageId: 0 as number, // e.g. the nth package for that orderLine
			weight: 0 as number,
			shippedAt: new Date() as Date,
		},
		// Composite PK: [orderId, productId, packageId]
		primaryKey: ['orderId', 'productId', 'packageId'] as const,
		relations: {
			// Each package references exactly one orderLine via (orderId, productId)
			orderLine: {
				type: 'references'         as const,
				target: 'orderLines'       as const,
				fkColumns: ['orderId', 'productId'] as const,
			},
		},
	},
} as const;

async function examplePackages() {
	const database = db(schema);

	// —— getAll for `orderLines` including `packages` relation ——
	// IntelliSense: when typing { packages: { … } }, you'll see "packages" suggested.
	// Inside { packages: { … } }, you'll see "orderLine" suggested (for the `packages` table).
	const linesWithPackages = await database.orderLines.getAll({
		packages: {

			orderLine: {
				order: {
					customer: {}
				}
			}
		},
	});
	// Inferred type of `linesWithPackages`:
	// Array<{
	//   orderId: number;
	//   productId: number;
	//   quantity: number;
	//   price: number;
	//
	//   packages: Array<{
	//     orderId: number;
	//     productId: number;
	//     packageId: number;
	//     weight: number;
	//     shippedAt: Date;
	//
	//     orderLine: {
	//       orderId: number;
	//       productId: number;
	//
	//       order: {
	//         id: number;
	//         customerId: number;
	//         placedAt: Date;
	//         status: string;
	//         customer: {
	//           id: number;
	//           name: string;
	//           email: string;
	//         } | null;
	//       } | null;
	//     } | null;
	//   }>;
	// }>

	console.log(linesWithPackages);

	// —— getById for a single package (composite PK) with nested relations ——
	const singlePkg = await database.packages.getById(
		{ orderId: 100, productId: 200, packageId: 1 },
		{
			orderLine: {
				order: {
					customer: {}
				}
			}
		}
	);

	// Inferred type of `singlePkg`:
	// {
	//   orderId: number;
	//   productId: number;
	//   packageId: number;
	//   weight: number;
	//   shippedAt: Date;
	//
	//   orderLine: {
	//     orderId: number;
	//     productId: number;
	//
	//     order: {
	//       id: number;
	//       customerId: number;
	//       placedAt: Date;
	//       status: string;
	//       customer: { id: number; name: string; email: string } | null;
	//     } | null;
	//   } | null;
	// } | null

	console.log(singlePkg);
}

examplePackages().catch(console.error);
