import type { TableClient } from '../../src/map2';

type Model = {
	order: {
		columns: {
			id: { ' type': 'numeric', ' notNull': true };
			maxAmount: { ' type': 'numeric', ' notNull': true };
		};
		primaryKey: readonly ['id'];
		relations: {
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

void manyId;
void oneId;

// @ts-expect-error Target columns remain contextually typed.
orderLine.many({ where: line => line.missing.eq(1) });

// @ts-expect-error Scope columns must exist on a mapped table.
orderLine.many({ where: (line, { root }) => line.orderId.eq(root.missing) });

// @ts-expect-error Ad-hoc descriptors are read-only and cannot request locks.
orderLine.many({ forUpdate: true });

// @ts-expect-error Ad-hoc aliases cannot replace mapped properties.
order.getMany({ id: orderLine.many() });

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
