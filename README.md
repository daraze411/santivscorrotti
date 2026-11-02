# Santi vs Corrotti · Playtest alfa 0.4

Versione di prova del gioco, basata sulle 32 carte della versione 1.7 e sulle correzioni concordate in chat (colonna Note ignorata).

## Novità della 0.4

- Dopo il primo round, ogni giocatore sceglie una carta avversaria superstite da eliminare definitivamente. Le due scelte sono rese note insieme. Le carte eliminate non rientrano nel mazzo del round 2.
- Ogni attivazione dell'automa apre un pannello che riassume la carta, il testo principale e le conseguenze registrate. Premi **Continua** per proseguire.
- Descrizioni su PC: passaggio del mouse; sul telefono: pulsante ⓘ. I tooltip del mouse sono adattati ai margini dello schermo; le finestre ⓘ sono scrollabili.

## Uso

Apri un terminale nella cartella dei file ed esegui:

    python -m http.server 8000

Apri http://localhost:8000 oppure carica tutti i file su GitHub Pages.

## Nota sullo stato del gioco

Si tratta di un'**alfa per playtest**: alcune interazioni delle abilità sono ancora da verificare e correggere. L'automa ha un'unica strategia provvisoria. Prima di ogni aggiornamento su GitHub, sostituisci tutti i file per evitare versioni miste e ricarica la pagina senza cache.

## Correzione 0.4.1
Descrizioni al passaggio del mouse spostate in un pannello esterno alle carte, con limiti di viewport; finestra informazioni touch ampliata. Nessuna modifica alle regole.

## 0.4.2
Corretto il pannello al passaggio del mouse: ora e fisso nell’angolo superiore destro e non segue piu la carta. Il pulsante info rimane invariato. Aggiornati i riferimenti con versione per evitare cache CSS/JS.
