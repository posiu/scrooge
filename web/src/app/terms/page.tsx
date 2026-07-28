import { MarketingNav } from '@/components/landing/MarketingNav';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

// Szablon regulaminu — pola oznaczone [DO UZUPEŁNIENIA] wymagają danych
// prawdziwego podmiotu świadczącego usługę oraz przeglądu prawnego przed
// publikacją produkcyjną, ze względu na przetwarzanie danych finansowych.

export const metadata = {
  title: 'Regulamin',
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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav variant="pricing" />

      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Regulamin
          </h1>
          <p className="text-sm text-muted-foreground">
            Ostatnia aktualizacja: 28 lipca 2026 r.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-3xl mx-auto">

          <Section id="postanowienia-ogolne" title="1. Postanowienia ogólne">
            <p>
              Niniejszy Regulamin określa zasady korzystania z aplikacji Scrooge — Domowy
              Controlling (dalej: „Aplikacja”, „Usługa”), dostępnej pod adresem usescrooge.com i
              app.usescrooge.com.
            </p>
            <p>
              Usługodawcą jest <strong>[DO UZUPEŁNIENIA: pełna nazwa i forma prawna
              Usługodawcy]</strong>, [DO UZUPEŁNIENIA: adres siedziby], NIP:
              [DO UZUPEŁNIENIA], kontakt: [DO UZUPEŁNIENIA: adres e-mail kontaktowy]
              (dalej: „Usługodawca”).
            </p>
            <p>
              Zasady przetwarzania danych osobowych opisane są odrębnie w{' '}
              <a href="/privacy">Polityce Prywatności</a>, która stanowi uzupełnienie niniejszego
              Regulaminu.
            </p>
          </Section>

          <Section id="definicje" title="2. Definicje">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Aplikacja / Usługa</strong> — aplikacja webowa Scrooge służąca do zarządzania budżetem domowym.</li>
              <li><strong>Użytkownik</strong> — osoba fizyczna korzystająca z Aplikacji.</li>
              <li><strong>Konto</strong> — indywidualny profil Użytkownika w Aplikacji, zabezpieczony logowaniem bez hasła (kod jednorazowy wysyłany na adres e-mail).</li>
              <li><strong>AI-asystent</strong> — opcjonalna funkcja Aplikacji korzystająca z zewnętrznych dostawców modeli językowych, konfigurowana i opłacana samodzielnie przez Użytkownika.</li>
            </ul>
          </Section>

          <Section id="zakres-uslugi" title="3. Zakres Usługi">
            <p>Aplikacja umożliwia w szczególności:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>ewidencję transakcji, kont, kategorii i budżetów miesięcznych,</li>
              <li>śledzenie zobowiązań (kredyty, raty, subskrypcje), celów oszczędnościowych, inwestycji, podatków i zajęć egzekucyjnych,</li>
              <li>import danych z plików Excel,</li>
              <li>eksport danych do plików Excel/CSV,</li>
              <li>wykresy i raporty finansowe,</li>
              <li>korzystanie z opcjonalnego AI-asystenta finansowego, po podaniu przez Użytkownika własnego klucza API do wybranego dostawcy,</li>
              <li>zgłaszanie i głosowanie na propozycje nowych funkcji (roadmapa).</li>
            </ul>
            <p>
              Zakres dostępnych funkcji może zależeć od wybranego planu — szczegóły znajdziesz na
              stronie <a href="/pricing">cennika</a>.
            </p>
          </Section>

          <Section id="konto" title="4. Rejestracja i konto">
            <p>
              Założenie Konta wymaga podania adresu e-mail i potwierdzenia go jednorazowym kodem
              (logowanie bez hasła). Użytkownik jest zobowiązany do zachowania poufności dostępu do
              swojej skrzynki e-mail — wszystkie działania wykonane po zalogowaniu na Konto uznaje
              się za działania Użytkownika.
            </p>
            <p>
              Z Aplikacji mogą korzystać wyłącznie osoby pełnoletnie, posiadające pełną zdolność do
              czynności prawnych.
            </p>
          </Section>

          <Section id="platnosci" title="5. Plany i płatności">
            <p>
              Aplikacja jest obecnie dostępna w modelu listy oczekujących (waitlist) przed
              publicznym uruchomieniem. Docelowe plany subskrypcyjne (Free, Basic, Pro) oraz zasady
              rozliczeń zostaną szczegółowo opisane przed ich udostępnieniem — aktualny zarys
              znajduje się na stronie <a href="/pricing">cennika</a>.
            </p>
          </Section>

          <Section id="obowiazki" title="6. Obowiązki Użytkownika">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>podawanie prawdziwych danych podczas rejestracji i korzystania z Aplikacji,</li>
              <li>korzystanie z Aplikacji zgodnie z prawem i dobrymi obyczajami,</li>
              <li>niepodejmowanie prób nieautoryzowanego dostępu do Aplikacji lub danych innych Użytkowników,</li>
              <li>
                samodzielna odpowiedzialność za poprawność danych finansowych wprowadzanych
                ręcznie lub importowanych z plików Excel,
              </li>
              <li>
                w przypadku korzystania z AI-asystenta — samodzielne pozyskanie, konfiguracja i
                pokrycie kosztów klucza API u wybranego dostawcy zewnętrznego oraz przestrzeganie
                warunków korzystania tego dostawcy.
              </li>
            </ul>
          </Section>

          <Section id="odpowiedzialnosc" title="7. Ograniczenie odpowiedzialności">
            <p>
              Aplikacja jest narzędziem wspierającym świadomość finansową i nie stanowi doradztwa
              finansowego, inwestycyjnego, podatkowego ani prawnego. Decyzje finansowe podejmowane
              na podstawie danych i analiz prezentowanych w Aplikacji Użytkownik podejmuje na
              własną odpowiedzialność.
            </p>
            <p>
              Usługodawca nie ponosi odpowiedzialności za skutki wynikające z nieprawidłowych lub
              niepełnych danych wprowadzonych przez Użytkownika, błędów w importowanych plikach ani
              za treści wygenerowane przez AI-asystenta, które mogą zawierać nieścisłości.
            </p>
            <p>
              Usługodawca dokłada starań, aby Aplikacja działała nieprzerwanie i poprawnie, jednak
              nie gwarantuje pełnej dostępności Usługi i zastrzega sobie prawo do przerw
              technicznych, w tym w celu konserwacji i aktualizacji.
            </p>
          </Section>

          <Section id="reklamacje" title="8. Reklamacje">
            <p>
              Reklamacje dotyczące działania Aplikacji można zgłaszać na adres:{' '}
              <strong>[DO UZUPEŁNIENIA: adres e-mail kontaktowy]</strong>. Reklamacja powinna
              zawierać opis problemu oraz dane kontaktowe Użytkownika. Usługodawca rozpatrzy
              reklamację w terminie 14 dni od jej otrzymania.
            </p>
          </Section>

          <Section id="rozwiazanie" title="9. Rozwiązanie umowy i usunięcie konta">
            <p>
              Użytkownik może w każdej chwili zrezygnować z korzystania z Aplikacji i zażądać
              usunięcia Konta wraz z powiązanymi danymi, kontaktując się na adres:{' '}
              <strong>[DO UZUPEŁNIENIA: adres e-mail kontaktowy]</strong>. Zasady i okres
              przechowywania danych po usunięciu Konta opisane są w{' '}
              <a href="/privacy">Polityce Prywatności</a>.
            </p>
          </Section>

          <Section id="wlasnosc" title="10. Własność intelektualna">
            <p>
              Aplikacja, jej kod, nazwa, logo i szata graficzna stanowią własność Usługodawcy i są
              chronione prawem autorskim. Dane finansowe wprowadzone przez Użytkownika pozostają
              jego własnością — Usługodawca przetwarza je wyłącznie w celu świadczenia Usługi.
            </p>
          </Section>

          <Section id="zmiany-regulaminu" title="11. Zmiany Regulaminu">
            <p>
              Usługodawca zastrzega sobie prawo do zmiany Regulaminu z ważnych przyczyn (np. zmiana
              zakresu Usługi, zmiana przepisów prawa). O zmianach Użytkownicy zostaną poinformowani
              z odpowiednim wyprzedzeniem poprzez Aplikację lub wiadomość e-mail.
            </p>
          </Section>

          <Section id="postanowienia-koncowe" title="12. Postanowienia końcowe">
            <p>
              W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa
              polskiego, w tym Kodeksu cywilnego oraz ustawy o świadczeniu usług drogą
              elektroniczną. Ewentualne spory będą rozstrzygane przez sąd właściwy zgodnie z
              obowiązującymi przepisami.
            </p>
          </Section>

        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
