# Gestore Conto — Prossimo aggiornamento

App gestionale del saldo personale che ora si estende con automazioni (movimenti ricorrenti, scadenze bollette), personalizzazione (categorie proprie) e privacy (blocco con PIN e biometria).
Tutto locale sul dispositivo, nessun login, resta coerente con il tema scuro e il selettore valute già presenti.

## Per chi è
Chi usa l'app per tenere traccia del proprio denaro e vuole:
- smettere di inserire a mano le voci fisse (stipendio, affitto, abbonamenti);
- non dimenticare le scadenze (bollette, rate);
- categorie che rispecchiano le proprie abitudini di spesa;
- un livello di privacy quando passa il telefono a qualcuno.

## Funzionalità principali ed esperienza

### 1. Movimenti ricorrenti
- Nuova voce "Ricorrenti" raggiungibile dalle Impostazioni.
- Ogni ricorrenza definisce: tipo (entrata/uscita), importo, sezione, categoria, nota, frequenza (settimanale, mensile, annuale), data di inizio, data di fine opzionale.
- All'apertura dell'app, l'app crea automaticamente le voci maturate dall'ultima apertura (es. se mancano 3 mensilità, le genera tutte con le date corrette).
- Lista con pausa/riprendi, modifica, elimina. Elimina non tocca i movimenti già creati.

### 2. Scadenze bollette (promemoria in-app)
- Nuova voce "Scadenze" nelle Impostazioni e sezione dedicata in Home.
- Ogni scadenza: nome, importo (opzionale), sezione da cui pagare (opzionale), data scadenza, ripeti? (una volta / mensile / bimestrale / annuale).
- Banner in alto nella Home quando c'è una scadenza entro 7 giorni, con colori chiari (verde = ok, giallo = entro 3 giorni, rosso = oggi/scaduta).
- Pulsante "Paga ora" sulla scadenza: crea un'uscita nella sezione scelta e, se ricorrente, pianifica la prossima; se una tantum, la archivia.
- Pulsante "Segna come pagata" (senza creare uscita) per chi tracciava la bolletta a parte.
- Nessuna notifica push o di sistema in questa fase: i promemoria arrivano aprendo l'app. Le notifiche di sistema sono previste nella Fase 2.

### 3. Blocco dell'app con PIN e biometria
- Prima apertura dopo l'aggiornamento: schermata di benvenuto che propone "Proteggi l'app". L'utente può saltare.
- Impostazione del PIN a 4 cifre, confermato due volte.
- Se il dispositivo supporta Face ID / impronta, interruttore "Sblocca con biometria" (richiede comunque un PIN come fallback).
- L'app si blocca al cold start e dopo 60 secondi in background.
- Da Impostazioni: cambia PIN, disattiva blocco (richiede PIN attuale), gestisci biometria.
- Dimenticato il PIN: nessun recupero (dati solo locali); si può resettare l'app dalle Impostazioni perdendo i dati, con doppia conferma.

### 4. Categorie personalizzate
- Nelle Impostazioni, due liste separate: "Categorie Entrate" e "Categorie Uscite".
- Per ciascuna: aggiungi, modifica (nome, icona, colore), riordina, elimina.
- 3 colori di default seguono la palette app (verde/rosa/viola) con possibilità di scegliere tra più toni; icone pescate dal set già usato nell'app.
- Le categorie di default restano modificabili ma non eliminabili (così da non lasciare mai l'utente senza).
- Eliminazione di una categoria personalizzata: le transazioni storiche conservano l'etichetta mostrando "(archiviata)".
- Nei moduli "Nuova Entrata/Uscita" compaiono tutte le categorie attive, in ordine utente.

### 5. Impostazioni (nuova schermata)
Punto d'ingresso per tutte le novità, raggiungibile da una rotella in alto a destra sulla Home.
Contiene: Ricorrenti, Scadenze, Categorie, Sicurezza (PIN/biometria), Valuta (chip già esistente), Info app, Reset dati.

## Flusso utente tipo
1. Apre l'app, inserisce PIN (o Face ID) → vede Home con un banner "Luce in scadenza fra 2 giorni — Paga ora".
2. Tocca "Paga ora": appare un riepilogo (importo, sezione, data), conferma, l'uscita è registrata e la scadenza è aggiornata per il mese successivo.
3. Il primo del mese l'app ha già aggiunto da sola lo stipendio e l'abbonamento Netflix definiti come ricorrenti.
4. Vuole aggiungere "Palestra" come categoria: Impostazioni → Categorie Uscite → + → sceglie icona e colore viola → salva. "Palestra" compare da subito nel modulo nuova uscita.

## Sensazione UI/UX
- Resta sulla linea "Dark Luxe" già impostata: nero/grigio dominanti, accenti verde/rosa/viola, bordi sottili, nessuna icona emoji nell'app (emoji solo nel selettore valute).
- Banner scadenze in Home segue la stessa semantica colori del resto (verde ok, giallo attenzione, rosso urgente/scaduta).
- Blocco app a tutta schermata, minimal: logo, 4 pallini del PIN, tastierino numerico centrato, icona impronta/Face ID in basso a destra.
- Impostazioni come lista pulita di righe con icona + titolo + sotto-testo (es. "Sicurezza — PIN attivo, biometria attiva"), accesso in dettaglio con push navigation.
- Form di ricorrenze e scadenze come bottom sheet coerenti con quelli già usati per transazioni e sezioni.

## Fasi di implementazione

### Fase 1 — MVP (si costruisce ora)
Tutto quanto descritto sopra:
- Movimenti ricorrenti (CRUD + generazione automatica all'apertura).
- Scadenze bollette con banner in Home e "Paga ora".
- Blocco app con PIN + biometria opzionale.
- Categorie personalizzate per entrate e uscite.
- Nuova schermata Impostazioni che raccoglie tutte le voci.

### Fase 2 — Approfondimento (dopo l'MVP, non ora)
- Notifiche di sistema (iOS/Android) per le scadenze — richiede la build nativa, non funziona in Expo Go.
- Modifica di un movimento esistente (oggi si può solo cancellare).
- Allegare una foto allo scontrino di un movimento (manuale, senza AI).

### Fase 3 — Evoluzione (dopo la Fase 2)
- Backup/ripristino manuale su file (export/import JSON).
- Gestione multi-conto formale (es. carte separate oltre alle sezioni).
- Report mensile riassuntivo esportabile in PDF.

## Assunzioni
Scelte prese senza chiedere, da confermare o correggere:
- I promemoria scadenze della Fase 1 sono solo in-app (banner all'apertura). Le notifiche di sistema sono rimandate alla Fase 2 perché richiedono una build reale e non lavorano in modo affidabile su Expo Go.
- Il PIN non è recuperabile: se dimenticato si resetta l'app perdendo i dati. Il salvataggio del PIN avviene nell'archivio sicuro del dispositivo (già disponibile), con un hash non reversibile.
- La biometria sblocca solo come scorciatoia: il PIN resta sempre obbligatorio come fallback.
- L'app si blocca al cold start e dopo 60 secondi in background; questi valori non sono configurabili in Fase 1.
- Le categorie di default restano modificabili ma non eliminabili per evitare uno stato "senza categorie".
- Eliminando una categoria personalizzata, le transazioni storiche la mostrano come "(archiviata)" senza essere perse o riassegnate.
- I movimenti ricorrenti maturati durante periodi di inattività dell'app vengono creati tutti insieme alla prossima apertura, con la data corretta (non con la data odierna).
- Il punto d'ingresso alle novità è una nuova rotella Impostazioni in Home; le quattro tab esistenti (Home/Sezioni/Movimenti/Analisi) restano invariate.
- Le funzioni di export, estratto conto e scanner scontrini non sono incluse (l'utente ha scelto esplicitamente di inserire a mano).
- Il tema dell'app resta solo scuro; il tema chiaro non è richiesto e non viene aggiunto.
- Multi-utente, condivisione, sincronizzazione cloud: non in programma — l'app rimane personale e locale.
