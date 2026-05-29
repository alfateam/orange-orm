# SAP Datetime Precision Summary

## Problem

En kunde fikk ikke treff i `saveChanges()` ved optimistic concurrency mot SAP/Sybase.

Eksempel:

```sql
UPDATE [dfs_session_engangsnokkel]
SET [used_time] = null
WHERE [dfs_session_engangsnokkel] = '0ca3a7a8-12fd-4ef6-b249-dd783680f333'
  AND [used_time] = '2026-05-28T14:23:06'
```

Mistanken var riktig: SAP-sporet leste ut datetime uten millisekunder, slik at `oldValue` i concurrency-sjekken bare hadde sekundpresisjon selv om databasen kunne lagre en verdi med millisekunder.

## Root Cause

I SAP brukes [src/sap/formatDateOut.js](/workspace/src/sap/formatDateOut.js), som formatterer dato/tid med:

```js
CONVERT(VARCHAR, ..., 23)
```

Dette gir format som `yyyy-mm-ddTHH:mm:ss`, altså uten millisekunder.

Dermed skjer dette:

1. Databasen kan lagre `2026-05-28T14:23:06.123`
2. ORM leser verdien som `2026-05-28T14:23:06`
3. `saveChanges()` bruker den avkuttede verdien som `oldValue`
4. Rå sammenligning i `WHERE` kan gi falskt ikke-treff

## Chosen Fix

Det ble **ikke** gjort en global endring i SAP date-formattering.

Grunnen er at `date()` i dagens modell brukes både for SQL `DATE` og SQL `DATETIME`, og en generell endring i uthenting kunne blitt en breaking change eller endret oppførsel for rene dato-kolonner.

I stedet ble optimistic concurrency gjort konsistent med det som faktisk ble lest:

- SAP `DateColumn` i `UPDATE` sammenlignes nå via `column.formatOut(context)` i stedet for rå kolonneverdi
- SAP `DateColumn` i delete-concurrency gjør det samme
- `NULL`-håndtering er beholdt som før

Det betyr at concurrency-sjekken nå bruker samme presisjon som ble lest tilbake fra SAP.

## Files Changed

- [src/table/commands/newUpdateCommandCore.js](/workspace/src/table/commands/newUpdateCommandCore.js)
- [src/table/commands/delete/singleCommand/newSingleCommandCore.js](/workspace/src/table/commands/delete/singleCommand/newSingleCommandCore.js)
- [tests/initSap.js](/workspace/tests/initSap.js)
- [tests/datetime-precision.test.js](/workspace/tests/datetime-precision.test.js)

## Test Coverage

SAP-testdata ble justert til å bruke ikke-null millisekunder:

```sql
'2023-07-14T12:00:00.123'
```

Det ble også lagt inn en isolert SAP-regresjonstest som verifiserer at:

- en rad leses inn uten millisekunder
- `saveChanges()` fortsatt klarer å matche gammel verdi
- `datetime` kan oppdateres til `null` uten falsk concurrency-feil

Kjørt test:

```bash
npx vitest run tests/datetime-precision.test.js --pool=forks --poolOptions.forks.singleFork
```

Resultat: passerte.

## Current Semantics After Fix

For SAP er optimistic concurrency for `date()`-kolonner nå i praksis sekundpresis, fordi det er den presisjonen som leses tilbake.

Viktig presisering:

- `SET column = ...` kan fortsatt skrive millisekunder dersom input og database støtter det
- `WHERE oldValue = ...` matcher med samme presisjon som ble lest tilbake

## Recommended Long-Term Direction

Hvis prosjektet senere vil støtte ekte datetime-presisjon eksplisitt, er anbefalingen:

- Behold `date()` som bakoverkompatibel type
- Introduser en ny `dateTime()`-type
- La `dateTime()` bety dato + klokkeslett + sub-sekundpresisjon når databasen støtter det
- La `dateWithTimeZone()` fortsette som egen eksplisitt type for offset/tidssone-semantikk

Dette unngår breaking change i dagens `date()`-bruk, samtidig som SAP og andre databaser kan få mer presis datetime-håndtering der det faktisk er ønsket.
