// schema.ts

/**
 * Example schema using string‐literal column types (no "as" syntax in property values,
 * but we assert the entire object as `const` so TS infers the literals correctly).
 */
export const schema = {
	customers: {
		columns: {
			id: 'uuid',
			name: 'string',
			email: 'string',
			defaultAddressId: 'uuid'
		},
		primaryKey: ['id'] as const,
		relations: {
			orders: {
				type: 'hasMany',
				target: 'orders',
				fkColumns: ['customerId'] as const
			},
			defaultAddress: {
				type: 'hasOne',
				target: 'deliveryAddresses',
				fkColumns: ['defaultAddressId'] as const
			}
		}
	},

	deliveryAddresses: {
		columns: {
			id: 'uuid',
			street: 'string',
			city: 'string',
			postalCode: 'string',
			country: 'string'
		},
		primaryKey: ['id'] as const
		// no relations back to customers here; it's defined on customers.defaultAddress
	},

	orders: {
		columns: {
			id: 'uuid',
			customerId: 'uuid',
			status: 'string',
			placedAt: 'date',
			deliveryAddressId: 'uuid'
		},
		primaryKey: ['id'] as const,
		relations: {
			customer: {
				type: 'references',
				target: 'customers',
				fkColumns: ['customerId'] as const
			},
			lines: {
				type: 'hasMany',
				target: 'orderLines',
				fkColumns: ['orderId'] as const
			},
			deliveryAddress: {
				type: 'hasOne',
				target: 'deliveryAddresses',
				fkColumns: ['deliveryAddressId'] as const
			}
		}
	},

	orderLines: {
		columns: {
			orderId: 'uuid',
			productId: 'uuid',
			quantity: 'numeric',
			price: 'numeric'
		},
		primaryKey: ['orderId', 'productId'] as const,
		relations: {
			order: {
				type: 'references',
				target: 'orders',
				fkColumns: ['orderId'] as const
			},
			packages: {
				type: 'hasMany',
				target: 'packages',
				fkColumns: ['orderLineOrderId', 'orderLineProductId'] as const
			}
		}
	},

	packages: {
		columns: {
			id: 'uuid',
			orderLineOrderId: 'uuid',
			orderLineProductId: 'uuid',
			weight: 'numeric',
			shippedAt: 'date'
		},
		primaryKey: ['id'] as const,
		relations: {
			orderLine: {
				type: 'references',
				target: 'orderLines',
				fkColumns: ['orderLineOrderId', 'orderLineProductId'] as const
			}
		}
	}
} as const;
