# /import-excel

Importuje transakcje z pliku Excel (.xlsx) lub CSV do bazy danych.

## Użycie
```
/import-excel [ścieżka do pliku]
```

## Kroki

1. **Sprawdź** czy plik istnieje i jest czytelny
2. **Wczytaj** plik przez SheetJS (`xlsx` library)
3. **Pokaż podgląd**: pierwsze 5 wierszy + wykryte kolumny + proponowane mapowanie
4. **Czekaj na potwierdzenie** użytkownika
5. **Waliduj** wszystkie wiersze (patrz skill: import-excel)
6. **Zaimportuj** w transakcji bazodanowej
7. **Pokaż raport**: zaimportowane / pominięte / błędy

## Pamiętaj
- Używaj skilla `import-excel/SKILL.md`
- Nigdy nie rób insertu bez podglądu i potwierdzenia
- Loguj błędy do pliku `import-errors-[timestamp].log`
