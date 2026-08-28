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
	};
};

declare const customer: TableClient<Model, 'customer'>;
declare const order: TableClient<Model, 'order'>;
declare const orderLine: TableClient<Model, 'orderLine'>;

const rowsPromise = order.getMany({
	matchingLines: orderLine.many({
		where: (line, { root, parent }) => line.orderId.eq(root.id)
			.and(line.amount.le(parent.maxAmount)),
		orderBy: 'id',
		limit: 2
	}),
	firstLine: orderLine.one({
		where: (line, { root }) => line.orderId.eq(root.id),
		orderBy: 'id'
	})
});

type Row = Awaited<typeof rowsPromise>[number];
declare const row: Row;

const manyId: number = row.matchingLines[0].id;
const oneId: number | undefined = row.firstLine?.id;

const scopedRowsPromise = customer.getMany({
	orders: {
		matchingLines: orderLine.many({
			where: (line, { root, parent }) => line.orderId.eq(parent.id)
				.and(line.amount.le(root.balance))
				.and(root.orders.any(relatedOrder => relatedOrder.id.gt(0)))
				.and(parent.customer.balance.gt(0)),
			id: true,
			orderId: false
		}),
		firstLine: orderLine.one({
			where: (line, { parent }) => line.orderId.eq(parent.id),
			id: true
		})
	}
});

type ScopedRow = Awaited<typeof scopedRowsPromise>[number];
declare const scopedRow: ScopedRow;
const scopedManyId: number = scopedRow.orders[0].matchingLines[0].id;
const scopedOneId: number | undefined = scopedRow.orders[0].firstLine?.id;

void manyId;
void oneId;
void scopedManyId;
void scopedOneId;

// @ts-expect-error Target columns remain contextually typed.
orderLine.many({ where: line => line.missing.eq(1) });

// @ts-expect-error Scope columns must exist on a mapped table.
orderLine.many({ where: (line, { root }) => line.orderId.eq(root.missing) });

customer.getMany({
	orders: {
		invalidRoot: orderLine.many({
			// @ts-expect-error Root is the customer table at this placement.
			where: (line, { root }) => line.amount.eq(root.maxAmount)
		}),
		invalidParent: orderLine.many({
			// @ts-expect-error Parent is the nested order table at this placement.
			where: (line, { parent }) => line.amount.eq(parent.balance)
		})
	}
});

order.getMany({
	invalidTarget: orderLine.many({
		// @ts-expect-error Target callbacks use orderLine columns.
		where: line => line.missing.eq(1)
	})
});

// @ts-expect-error Strategy factories are not part of the ad-hoc API.
orderLine.many(() => ({}));

// @ts-expect-error Ad-hoc descriptors are read-only and cannot request locks.
orderLine.many({ forUpdate: true });

// @ts-expect-error Ad-hoc aliases cannot replace mapped properties.
order.getMany({ id: orderLine.many() });
