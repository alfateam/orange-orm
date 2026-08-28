import type { TableClient } from '../../src/map2';

type Model = {
	customer: {
		columns: {
			id: { ' type': 'numeric', ' notNull': true };
			name: { ' type': 'string', ' notNull': true };
			balance: { ' type': 'numeric', ' notNull': true };
		};
		primaryKey: readonly ['id'];
		relations: {
			orders: { type: 'hasMany', target: 'order' };
		};
	};
	order: {
		columns: {
			id: { ' type': 'numeric', ' notNull': true };
			maxAmount: { ' type': 'numeric', ' notNull': true };
		};
		primaryKey: readonly ['id'];
		relations: {
			customer: { type: 'references', target: 'customer' };
			lines: { type: 'hasMany', target: 'orderLine' };
		};
	};
	orderLine: {
		columns: {
			id: { ' type': 'numeric', ' notNull': true };
			orderId: { ' type': 'numeric', ' notNull': true };
			amount: { ' type': 'numeric', ' notNull': true };
		};
		primaryKey: readonly ['id'];
		relations: {};
	};
	package: {
		columns: {
			id: { ' type': 'numeric', ' notNull': true };
			lineId: { ' type': 'numeric', ' notNull': true };
		};
		primaryKey: readonly ['id'];
		relations: {};
	};
};

declare const customer: TableClient<Model, 'customer'>;
declare const order: TableClient<Model, 'order'>;
declare const orderLine: TableClient<Model, 'orderLine'>;

const rowsPromise = order.getMany({
	matchingLines: (currentOrder, { db, root }) => db.orderLine.many({
		where: line => line.orderId.eq(root.id)
			.and(line.amount.le(currentOrder.maxAmount)),
		orderBy: 'id',
		limit: 2,
		packages: (currentLine, { db }) => db.package.many({
			where: pkg => pkg.lineId.eq(currentLine.id)
				.and(currentLine.orderId.eq(currentOrder.id))
		})
	}),
	firstLine: (_, { db, root }) => db.orderLine.one({
		where: line => line.orderId.eq(root.id),
		orderBy: 'id'
	})
});

type Row = Awaited<typeof rowsPromise>[number];
declare const row: Row;

const manyId: number = row.matchingLines[0].id;
const nestedPackageId: number = row.matchingLines[0].packages[0].id;
const oneId: number | undefined = row.firstLine?.id;

const scopedRowsPromise = customer.getMany({
	orders: {
		matchingLines: (currentOrder, { db, root }) => db.orderLine.many({
			where: line => line.orderId.eq(currentOrder.id)
				.and(line.amount.le(root.balance))
				.and(root.orders.any(relatedOrder => relatedOrder.id.gt(0)))
				.and(currentOrder.customer.balance.gt(0)),
			id: true,
			orderId: false
		}),
		firstLine: (currentOrder, { db }) => db.orderLine.one({
			where: line => line.orderId.eq(currentOrder.id),
			id: true
		})
	}
});

type ScopedRow = Awaited<typeof scopedRowsPromise>[number];
declare const scopedRow: ScopedRow;
const scopedManyId: number = scopedRow.orders[0].matchingLines[0].id;
const scopedOneId: number | undefined = scopedRow.orders[0].firstLine?.id;

void manyId;
void nestedPackageId;
void oneId;
void scopedManyId;
void scopedOneId;

order.getMany({
	invalidTargetColumn: (_, { db }) => db.orderLine.many({
		// @ts-expect-error Target columns remain contextually typed.
		where: line => line.missing.eq(1)
	}),
	invalidScopeColumn: (_, { db, root }) => db.orderLine.many({
		// @ts-expect-error Scope columns must exist on the root table.
		where: line => line.orderId.eq(root.missing)
	})
});

customer.getMany({
	orders: {
		invalidRoot: (_, { db, root }) => db.orderLine.many({
			// @ts-expect-error Root is the customer table at this placement.
			where: line => line.amount.eq(root.maxAmount)
		}),
		invalidCurrent: (currentOrder, { db }) => db.orderLine.many({
			// @ts-expect-error Current is the nested order table at this placement.
			where: line => line.amount.eq(currentOrder.balance)
		})
	}
});

order.getMany({
	invalidTarget: (_, { db }) => db.orderLine.many({
		// @ts-expect-error Target callbacks use orderLine columns.
		where: line => line.missing.eq(1)
	})
});

// @ts-expect-error Ad-hoc builders are only exposed inside strategy functions.
orderLine.many({});

order.getMany({
	locked: (_, { db }) => db.orderLine.many({
		// @ts-expect-error Ad-hoc descriptors are read-only and cannot request locks.
		forUpdate: true
	})
});

// @ts-expect-error Ad-hoc aliases cannot replace mapped properties.
order.getMany({ id: (_, { db }) => db.orderLine.many() });

const mappedRowsPromise = order.getMany({
	lines: {
		amount: true,
		orderId: false,
		orderBy: 'id',
		limit: 1
	}
});

type MappedRow = Awaited<typeof mappedRowsPromise>[number];
declare const mappedRow: MappedRow;
const mappedAmount: number = mappedRow.lines[0].amount;
void mappedAmount;

// @ts-expect-error Internally selected tracking keys stay out of the result type.
mappedRow.lines[0].id;
