# Santi vs Corrotti · alfa giocabile 0.3

## Avvio
Estrarre la cartella; in Windows aprire la cartella contenente `index.html`, digitare `cmd` nella barra del percorso e nel terminale avviare `python -m http.server 8000`. Aprire `http://localhost:8000`.

## Novità
- Partita completa in due round contro un automa sperimentale.
- Carte con nome, costo, Dominio, iniziativa e breve testo subito visibili; spiegazione completa al passaggio del mouse o clic su ⓘ (anche su smartphone).
- Schieramento, costo, pesca, effetti principali, effetti scoperti, secondari, punti e una scelta di eliminazione permanente tra i round.
- Scelte interattive dei bersagli; log delle azioni.

## Attenzione: versione di prova, non definitiva
Questa alfa non è ancora una trasposizione certificata del regolamento. Alcune situazioni particolari necessitano ancora di test e di rifinitura: contro-effetti retroattivi (Giuliano), copie di effetti con molte scelte, alcuni effetti passivi e annullamenti, gestione di informazioni segrete, simultaneità, sostituzione durante uno schieramento, punteggi e scelta di eliminazione definitiva in condizioni particolari. L'automa è casuale/euristico e non possiede ancora tre livelli. Questa versione serve per trovare errori nel flusso di partita.

La colonna Note del foglio Excel non è utilizzata. Le correzioni concordate di Mario Adinolfi, Martin Lutero, Galileo e Lucifero sono applicate nell'interfaccia.
