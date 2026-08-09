import type { TableClient } from '../../src/map2';

type Model = {
	actorRole: {
		columns: {
			id: { ' type': 'numeric', ' notNull': true };
			actorOrgnr: { ' type': 'string', ' notNull': true };
		};
		primaryKey: readonly ['id'];
		relations: {
			company: { type: 'references', target: 'company' };
		};
	};
	company: {
		columns: {
			name: { ' type': 'string', ' notNull': true };
		};
		primaryKey: readonly ['name'];
	};
};

declare const actorRole: TableClient<Model, 'actorRole'>;

const distinctRows = actorRole.distinct({
	orgnr: row => row.actorOrgnr,
	navn: row => row.company.name,
	where: row => row.id.greaterThan(0),
	limit: 10,
	offset: 2,
	orderBy: ['orgnr', 'navn desc'] as const,
});

const aggregateRows = actorRole.aggregate({
	orgnr: row => row.actorOrgnr,
	antall: row => row.count(inner => inner.id),
	orderBy: 'antall desc',
});

type DistinctRow = Awaited<typeof distinctRows>[number];
type AggregateRow = Awaited<typeof aggregateRows>[number];

declare const distinctRow: DistinctRow;
declare const aggregateRow: AggregateRow;

const orgnr: string | null | undefined = distinctRow.orgnr;
const navn: string | null | undefined = distinctRow.navn;
const antall: number = aggregateRow.antall;

void orgnr;
void navn;
void antall;

// @ts-expect-error Query options must not be exposed on result rows.
distinctRow.orderBy;

// @ts-expect-error Only aliases selected by this aggregate strategy are valid.
actorRole.distinct({ orgnr: row => row.actorOrgnr, orderBy: ['missing'] });

// @ts-expect-error An original column is invalid unless selected under that alias.
actorRole.aggregate({ orgnr: row => row.actorOrgnr, orderBy: 'id' });

// @ts-expect-error Only asc and desc are valid directions.
actorRole.aggregate({ orgnr: row => row.actorOrgnr, orderBy: 'orgnr sideways' });

// @ts-expect-error Selector callbacks remain contextually typed when options are present.
actorRole.distinct({ orgnr: row => row.missing, limit: 10, orderBy: 'orgnr' });
