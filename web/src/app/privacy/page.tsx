import { MarketingNav } from '@/components/landing/MarketingNav';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

// Szablon polityki prywatności dopasowany do faktycznego zakresu przetwarzania
// danych w aplikacji (patrz sekcje 2–4). Ponieważ Scrooge przetwarza dane
// finansowe, przed publikacją produkcyjną zalecana jest weryfikacja przez
// prawnika / IOD — w szczególności pól oznaczonych [DO UZUPEŁNIENIA].

export const metadata = {
  title: 'Polityka Prywatności',
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_a]:text-[#01581E] [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav variant="pricing" />

      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Polityka Prywatności
          </h1>
          <p className="text-sm text-muted-foreground">
            Ostatnia aktualizacja: 28 lipca 2026 r.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-3xl mx-auto">

          <Section id="administrator" title="1. Administrator danych">
            <p>
              Administratorem danych osobowych przetwarzanych w związku z korzystaniem z aplikacji
              Scrooge (dalej: „Aplikacja”, „Usługa”) jest:
            </p>
            <p>
              <strong>[DO UZUPEŁNIENIA: pełna nazwa i forma prawna Usługodawcy]</strong><br />
              [DO UZUPEŁNIENIA: adres siedziby]<br />
              [DO UZUPEŁNIENIA: NIP / REGON]<br />
              Kontakt w sprawach danych osobowych: [DO UZUPEŁNIENIA: adres e-mail kontaktowy]
            </p>
            <p>
              W dalszej części dokumentu Administrator określany jest jako „my”, a osoba korzystająca
              z Aplikacji jako „Użytkownik” lub „Ty”.
            </p>
          </Section>

          <Section id="zakres" title="2. Jakie dane przetwarzamy">
            <p>W zależności od sposobu korzystania z Aplikacji przetwarzamy:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Dane konta</strong> — adres e-mail używany do logowania bez hasła (kod
                jednorazowy OTP) za pośrednictwem Supabase Auth.
              </li>
              <li>
                <strong>Dane finansowe wprowadzane przez Ciebie</strong> — transakcje (data, kwota,
                typ, opis, tagi), konta (bank, gotówka, kryptowaluty, fundusze, polisy), kategorie,
                budżety miesięczne, zobowiązania (kredyty, raty, subskrypcje), cele oszczędnościowe,
                inwestycje, podatki i zajęcia egzekucyjne — w zakresie, w jakim samodzielnie
                wprowadzisz je do Aplikacji lub zaimportujesz z pliku Excel.
              </li>
              <li>
                <strong>Dane z importu plików Excel</strong> — przetwarzane wyłącznie w celu
                zasilenia Twoich transakcji; plik źródłowy nie jest przechowywany po zakończeniu
                importu.
              </li>
              <li>
                <strong>Dane z formularza listy oczekujących (waitlist)</strong> — imię, adres
                e-mail oraz znacznik czasu wyrażonej zgody na kontakt.
              </li>
              <li>
                <strong>Dane ze zgłoszeń funkcji i głosów na roadmapie</strong> — treść zgłoszenia,
                opcjonalnie imię i adres e-mail, jeśli zostaną podane.
              </li>
              <li>
                <strong>Ustawienia i klucze API AI-asystenta</strong> — jeśli włączysz AI-asystenta,
                jego konfiguracja (w tym Twój własny klucz API do wybranego dostawcy) jest
                przechowywana wyłącznie lokalnie w Twojej przeglądarce (localStorage) i{' '}
                <strong>nigdy nie trafia do naszej bazy danych</strong>.
              </li>
              <li>
                <strong>Treść rozmów z AI-asystentem</strong> — analogicznie przechowywana wyłącznie
                lokalnie na Twoim urządzeniu; w naszej bazie zapisujemy jedynie metadane sesji
                (tytuł, model, liczba wiadomości), nigdy treść wiadomości.
              </li>
              <li>
                <strong>Dane techniczne</strong> — adres IP i znaczniki czasu żądań, wykorzystywane
                krótkoterminowo do ochrony formularzy publicznych przed nadużyciami (limitowanie
                liczby zgłoszeń).
              </li>
            </ul>
          </Section>

          <Section id="cele" title="3. Cele i podstawy prawne przetwarzania">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Świadczenie Usługi</strong> (art. 6 ust. 1 lit. b RODO) — założenie i
                obsługa konta, przechowywanie i prezentowanie Twoich danych finansowych,
                generowanie wykresów i raportów.
              </li>
              <li>
                <strong>Zgoda</strong> (art. 6 ust. 1 lit. a RODO) — zapis na listę oczekujących i
                kontakt w sprawie uruchomienia produktu; zgodę możesz wycofać w dowolnym momencie.
              </li>
              <li>
                <strong>Prawnie uzasadniony interes Administratora</strong> (art. 6 ust. 1 lit. f
                RODO) — bezpieczeństwo Aplikacji, przeciwdziałanie nadużyciom (rate limiting),
                utrzymanie ciągłości działania, dochodzenie roszczeń.
              </li>
              <li>
                <strong>Obowiązek prawny</strong> (art. 6 ust. 1 lit. c RODO) — jeśli wynika to z
                przepisów prawa (np. rozpatrywanie reklamacji).
              </li>
            </ul>
          </Section>

          <Section id="odbiorcy" title="4. Komu przekazujemy dane">
            <p>Twoje dane mogą być przetwarzane przez następujące podmioty, wyłącznie w zakresie
              niezbędnym do świadczenia Usługi:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Supabase</strong> — dostawca bazy danych PostgreSQL i mechanizmu
                uwierzytelniania (logowanie OTP).
              </li>
              <li>
                <strong>Vercel</strong> — dostawca hostingu i infrastruktury serverless, na której
                działa Aplikacja.
              </li>
              <li>
                <strong>Dostawca AI wybrany przez Ciebie</strong> (np. OpenAI, Anthropic, Google lub
                inny kompatybilny z API OpenAI) — <strong>wyłącznie jeśli</strong> samodzielnie
                skonfigurujesz i użyjesz AI-asystenta. W takim przypadku treść Twojego zapytania
                jest przesyłana bezpośrednio do wybranego dostawcy w celu wygenerowania odpowiedzi.
                Taki transfer może wiązać się z przekazaniem danych poza Europejski Obszar
                Gospodarczy — zalecamy zapoznanie się z polityką prywatności wybranego dostawcy
                przed skorzystaniem z tej funkcji.
              </li>
            </ul>
            <p>
              Nie sprzedajemy Twoich danych i nie przekazujemy ich podmiotom trzecim w celach
              marketingowych.
            </p>
          </Section>

          <Section id="okres" title="5. Jak długo przechowujemy dane">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Dane konta i dane finansowe — przez czas posiadania konta w Aplikacji.</li>
              <li>
                Usunięte przez Ciebie transakcje są oznaczane jako usunięte (nie są widoczne w
                Aplikacji) i usuwane trwale przy usunięciu konta.
              </li>
              <li>
                Dane z listy oczekujących — do czasu wycofania zgody albo publicznego uruchomienia
                produktu i rozsądnego okresu po nim.
              </li>
              <li>Dane techniczne służące ochronie przed nadużyciami — nie dłużej niż 30 dni.</li>
            </ul>
          </Section>

          <Section id="prawa" title="6. Twoje prawa">
            <p>Zgodnie z RODO przysługuje Ci prawo do:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>dostępu do swoich danych,</li>
              <li>sprostowania nieprawidłowych danych,</li>
              <li>usunięcia danych („prawo do bycia zapomnianym”),</li>
              <li>ograniczenia przetwarzania,</li>
              <li>
                przenoszenia danych — swoje transakcje i budżet możesz w każdej chwili
                wyeksportować z poziomu Aplikacji do pliku Excel/CSV,
              </li>
              <li>wniesienia sprzeciwu wobec przetwarzania,</li>
              <li>cofnięcia zgody w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem,</li>
              <li>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (PUODO).</li>
            </ul>
            <p>
              Aby skorzystać z powyższych praw, w tym z prawa do usunięcia konta i wszystkich
              powiązanych danych, napisz do nas na adres:{' '}
              <strong>[DO UZUPEŁNIENIA: adres e-mail kontaktowy]</strong>. Usunięcie konta jest
              obecnie realizowane ręcznie przez administratora po weryfikacji zgłoszenia.
            </p>
          </Section>

          <Section id="bezpieczenstwo" title="7. Bezpieczeństwo danych">
            <p>
              Dostęp do danych finansowych jest ograniczony wyłącznie do konta Użytkownika, do
              którego należą (mechanizm kontroli dostępu na poziomie wiersza — RLS). Połączenia z
              Aplikacją są szyfrowane (HTTPS). Klucze API do AI oraz treść rozmów z AI-asystentem
              nigdy nie są przesyłane na nasze serwery ani zapisywane w naszej bazie danych.
            </p>
          </Section>

          <Section id="cookies" title="8. Pliki cookies i przechowywanie lokalne">
            <p>
              Używamy wyłącznie niezbędnych plików cookies do utrzymania sesji logowania (Supabase
              Auth) oraz danych zapisanych lokalnie w przeglądarce (localStorage) do zapamiętania
              wybranego motywu (jasny/ciemny), konfiguracji AI-asystenta i treści rozmów z
              AI-asystentem. Nie używamy cookies reklamowych ani analitycznych podmiotów trzecich.
            </p>
          </Section>

          <Section id="zmiany" title="9. Zmiany Polityki Prywatności">
            <p>
              Możemy okresowo aktualizować niniejszą Politykę Prywatności. O istotnych zmianach
              poinformujemy Cię poprzez Aplikację lub wiadomość e-mail. Data ostatniej aktualizacji
              widnieje na początku dokumentu.
            </p>
          </Section>

          <Section id="kontakt" title="10. Kontakt">
            <p>
              W sprawach związanych z ochroną danych osobowych skontaktuj się z nami:{' '}
              <strong>[DO UZUPEŁNIENIA: adres e-mail kontaktowy]</strong>.
            </p>
          </Section>

        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
