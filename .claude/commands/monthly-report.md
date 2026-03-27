# /monthly-report

Generuje raport budżet vs. realizacja dla wybranego miesiąca.

## Użycie
```
/monthly-report [YYYY-MM]
```
Bez argumentu: bieżący miesiąc.

## Kroki

1. Pobierz transakcje dla miesiąca (tylko `deleted_at IS NULL`)
2. Pobierz budżety dla miesiąca
3. Pogrupuj transakcje per kategoria
4. Wylicz % wykonania budżetu
5. Wyświetl raport w formacie tabelarycznym
6. Dodaj komentarz (co ok, co wymaga uwagi)

## Używaj skilla
`budget-report/SKILL.md` — tam jest pełna logika, SQL i format wyjścia.
