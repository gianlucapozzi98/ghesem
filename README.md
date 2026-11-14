# Ghe sem · Concorezzo

Sito statico (HTML, CSS e JavaScript, senza build né dipendenze) più una piccola funzione su Vercel per il menu del giorno.

```
index.html      contenuti e struttura
privacy.html    informativa privacy e cookie
robots.txt      regole per i motori di ricerca, con il link alla sitemap
sitemap.xml     elenco delle pagine per Google (se ne aggiungi una, aggiungila qui)
css/style.css   stile (font, palette in cima al file)
js/main.js      comportamento (orari in cima al file)
api/menu.js     legge il menu dal foglio Google e lo passa al sito (risponde a /api/menu)
fonts/          font ospitati sul sito (Fraunces, DM Sans, Caveat: SIL Open Font License)
img/foto/       foto in WebP, in più larghezze
img/logo-ghe-sem.svg   logo (ricalcato dall'insegna), usato nella barra, nell'hero e nel footer
favicon.svg            icona della scheda (il logo intero su fondo vino)
favicon.ico, favicon-32.png, favicon-192.png, apple-touch-icon.png   la stessa icona in ICO e PNG (Google, Safari, iPhone)
```

## Nessun dato a terzi

Aprendo il sito il browser del visitatore parla solo con questo sito: font, foto e logo sono nel progetto e il menu passa da `/api/menu`. Gli unici servizi esterni partono su richiesta del visitatore (mappa di Google al clic su «Mostra la mappa», link a Google Maps e WhatsApp). Per questo non serve il banner dei cookie. Se si aggiungono statistiche, pixel o altri servizi esterni, va aggiornata `privacy.html` e quasi sempre serve un banner.

## Vederlo in locale

```bash
python3 -m http.server 5173
```

Poi apri http://127.0.0.1:5173. In locale `/api/menu` non esiste, quindi il sito mostra il menu scritto in `index.html`.

## Pubblicarlo su Vercel

Il sito si pubblica da solo a ogni push su `main`. La cartella `api/` viene trasformata da Vercel in una funzione, senza configurazione.

## Cose da aggiornare

**Menu del giorno**. Lo aggiorna il locale dal foglio Google (anche dall'app Fogli sul telefono): una riga "Data del menu" e poi una riga per piatto, con Categoria (Primi, Secondi, Contorni, Dolce), Piatto e Descrizione. Il foglio deve restare pubblicato (File → Condividi → Pubblica sul web). Il link CSV del foglio è in `api/menu.js`; il sito rilegge il foglio al massimo una volta al minuto, più il ritardo di Google (circa 5 minuti). Se il foglio non risponde, il sito mostra il menu scritto in `index.html` (sezione `id="menu"`): conviene aggiornarlo ogni tanto, perché è quello che vede chi ha JavaScript spento, compresi molti assistenti AI che leggono il sito. Non ha data apposta: la data compare solo quando arriva dal foglio.

**Orari**. Vanno cambiati in quattro posti:
1. la tabella in `id="dove"` (`index.html`)
2. l'oggetto `HOURS` in cima a `js/main.js` (alimenta "Aperto ora / Chiuso")
3. i dati strutturati `openingHoursSpecification` nel `<head>` (per Google)
4. il riepilogo nel footer

**Foto**. Per ora sono segnaposto prese da Unsplash e salvate in `img/foto/` (nome che dice dove sono usate, poi la larghezza: `hero-banco-800.webp`). Per metterci le foto vere basta sostituire i file tenendo gli stessi nomi e larghezze, in WebP. L'immagine di anteprima per i link condivisi è `img/foto/hero-pranzo-1200x630.jpg` (`og:image` nel `<head>`).

## Prima di andare online

- Sostituire le foto segnaposto e togliere la dicitura nel footer.
