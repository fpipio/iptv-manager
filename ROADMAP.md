# 🗺️ IPTV Manager - Development Roadmap

> **IMPORTANTE**: Questo file è la **guida centrale** del progetto. Deve essere **aggiornato automaticamente** ad ogni completamento di task, modifica architetturale o decisione importante.

> 📜 Per dettagli storici, changelog completo e note di rilascio, vedi [HISTORY.md](HISTORY.md)

---

## 📋 Indice

- [Stato Attuale](#stato-attuale)
- [Architettura](#architettura)
- [Fasi Completate](#fasi-completate)
- [Fasi Future](#fasi-future)
- [Decisioni Architetturali](#decisioni-architetturali)
- [Note Tecniche](#note-tecniche)
- [Known Issues](#known-issues)
- [Idee Future](#idee-future)
- [Comandi Rapidi](#comandi-rapidi)

---

## 🎯 Stato Attuale

**Ultimo Aggiornamento**: 2025-10-23

**Versione Corrente**: v0.9.7

**Fase Corrente**: ✅ **Fase 5 (Parziale)** - Ricerca Canali + Import Asincrono + **Movie Cleanup System** + **Multi-Library Year Organization** + **Emby Global Refresh** + **Subtitle Backup System** + **NFS Cache Fix** Implementati

**Prossima Fase**: Fase 3.2 (Serie TV) o Completamento Fase 5 (Filtri Avanzati)

### Funzionalità Operative
- ✅ **Import M3U asincrono con progress bar** (file upload + URL, dual-tab TV|Movies, batch processing 500 items)
- ✅ Gestione completa canali TV (CRUD, drag & drop, bulk edit, selezione multipla)
- ✅ Gestione gruppi (CRUD, riordinamento, gruppo speciale "Unassigned")
- ✅ **Ricerca canali real-time** (search bar con filtro su nome, tvg-id, logo URL)
- ✅ **Gestione film con generazione .strm files** (job queue asincrono, progress tracking)
- ✅ **🧹 Movie Cleanup System** (rimozione automatica nomi attori, 89 pattern predefiniti, preview bulk, tracking storico)
- ✅ **📅 Multi-Library Year Organization** (organizzazione film per periodi anno in sottocartelle, toggle enable/disable, statistiche distribuzione)
- ✅ **🎬 Emby Integration** (refresh globale tutte le librerie con un solo click, configurazione semplificata)
- ✅ **💾 Subtitle Backup System** (backup/restore automatico file .srt durante cancellazione/ripristino film, ripristino parziale supportato)
- ✅ **🔧 NFS Cache Fix** (fsync file + directory per compatibilità NFS mount, 4 endpoint diagnostici per troubleshooting)
- ✅ **EPG Multi-Source Matching System** (auto-matching, custom XML, grab ottimizzato)
- ✅ **Gestione duplicati tvg-ID avanzata** (pre-import analysis, modal strategia, tracking permanente)
- ✅ Export M3U e server HTTP per playlist
- ✅ Reset granulare contestuale (separazione domini TV/Movies)
- ✅ Container Docker con production deployment funzionante
- ✅ Keep-alive routing per navigazione istantanea

### Funzionalità Mancanti
- ❌ Gestione Serie TV
- ❌ Filtri avanzati (per gruppo, stato, modifiche)
- ❌ Schedulazione automatica EPG

---

## 🏗️ Architettura

### Stack Tecnologico
- **Backend**: Node.js 20 + Express
- **Frontend**: Vue.js 3 + Vite + TailwindCSS
- **Database**: SQLite (file-based)
- **Container**: Docker (single container, multi-stage build)
- **Deployment**: Docker Compose

### Struttura Database

**Tabelle Principali**:
- `channels`: Canali TV con campi `imported_*` (valori originali) e `custom_*` (personalizzazioni)
- `group_titles`: Gruppi con riordinamento e gruppo speciale "Unassigned"
- `movies`: Film con tracking `.strm` files e group-title
- `epg_sources`: Sorgenti EPG configurate
- `epg_source_channels`: Canali EPG disponibili per source
- `channel_epg_mappings`: Mapping canali TV → EPG channels
- `migrations`: Tracking migrazioni database

**Campi Chiave**:
- `imported_*` fields: Valori originali dall'ultimo import (sempre aggiornati)
- `custom_*` fields: Valori personalizzati dall'utente (preservati tra import)
- `is_*_overridden`: Flag per sapere quale valore usare (custom vs imported)
- `original_tvg_id`: Tracking permanente tvg-ID originale (per duplicati rinominati)

### Directory Structure
```
/app/data/               # Volume persistente Docker
  ├── database.sqlite    # Database SQLite
  ├── output/            # M3U export files
  ├── epg/              # EPG XML files (guide.xml, custom.channels.xml)
  └── movies/           # STRM files
      ├── {movie_name}/{movie_name}.strm           # Struttura FLAT (default)
      └── {year_library}/{movie_name}/{movie_name}.strm  # Con year organization
```

---

## ✅ Fasi Completate

### **Fase 1** - Setup Iniziale (100%)
- Backend Node.js + Express + SQLite
- Frontend Vue 3 + Vite + TailwindCSS
- Docker single-container con multi-stage build
- Database migrations system

### **Fase 2** - UI Avanzata (100%)
- Modali edit gruppo/canale completi
- Drag & Drop riordinamento (gruppi + canali)
- Bulk Edit Mode con selezione multipla e Shift-Click
- Toast notifications system
- Visual indicators per canali personalizzati

### **Fase 3** - Gestione Film (100%)
- Import film da M3U con rilevamento automatico (`/movie/` URL pattern)
- Generazione file `.strm` con struttura FLAT
- **Job Queue asincrono** per operazioni filesystem non bloccanti
- **Import asincrono con batch processing** (500 items/batch, non blocca server su 30k+ items)
- **Progress tracking real-time** con progress bar animata e polling (500ms interval)
- MoviesView con caricamento progressivo ottimizzato (batch 1000)
- 15+ endpoints API completi
- Checkbox inline per toggle STRM generation per gruppo

### **Fase 4 & 4.5** - EPG Management (100%)
- EPG Multi-Source Matching System
- Auto-matching intelligente canali → EPG con priorità configurabile
- Custom channels XML generation
- Grab EPG ottimizzato (solo canali matched, 93% grab time ridotto)
- Production deployment fixes (EPG grabber embedded, URL relativi)
- **Gestione Duplicati tvg-ID Avanzata**:
  - Pre-import analysis con rilevamento duplicati (in-file + database)
  - Modal strategia duplicati (replace/rename/skip)
  - Auto-rename duplicati interni al file
  - Tracking permanente con campo `original_tvg_id`
  - Indicatori visivi in ManageView (icona ↻ arancione)

### **Fase 5.1** - Movie Cleanup System (100%)
- **🧹 Sistema di pulizia automatica nomi film** per rimuovere nomi attori e migliorare matching Emby/Plex
- **Database Tables**:
  - `cleanup_patterns`: 89 pattern predefiniti (attori italiani + internazionali) + custom regex
  - `cleanup_history`: Tracking completo modifiche con audit trail
  - `year_libraries`: Configurazione parametrica per organizzazione multi-libreria
- **Pattern Detection**:
  - Auto-detect pattern: `{Attore} {Titolo} ({Anno})` → `{Titolo} ({Anno})`
  - Pattern reversibile: `{Titolo} {Attore} ({Anno})` → `{Titolo} ({Anno})`
  - Support per pattern custom regex utente
  - Enable/disable selettivo per pattern (toggle UI con label "Enabled/Disabled")
- **Duplicate Handling** (🆕):
  - Gestione automatica duplicati con vincolo UNIQUE su `tvg_name`
  - Auto-rename con suffisso `[2]`, `[3]`, ecc. quando nome pulito esiste già
  - Esempio: `Bruce Willis Acts of Violence (2018)` → `Acts of Violence (2018) [2]`
  - Safety limit: fino a 100 duplicati gestiti, fallback timestamp per edge cases
- **UI Features**:
  - Tab "Cleanup Names" in MoviesView con sistema tabs completo
  - **Category Filters**: Checkbox per filtrare per group_title prima del cleanup
  - Pulsante "Analyze Movies" per scan completo collection (30k movies in 2-3s)
  - Preview table con before/after (paginazione 50 risultati)
  - Bulk selection con "Select All" checkbox
  - Apply cleanup con conferma e toast feedback **con error reporting**
  - Auto-reload analyze dopo cleanup (invece di rimozione manuale dalla lista)
  - Statistiche real-time (patterns loaded, movies cleaned, last cleanup)
  - **Pattern Manager UI**: Add/delete custom patterns, toggle enable/disable
- **Backend API** (7 endpoints):
  - `GET /api/cleanup/analyze` - Analizza film e restituisce suggestions
  - `POST /api/cleanup/apply` - Applica cleanup bulk + history tracking + duplicate handling
  - `GET /api/cleanup/patterns` - Lista **tutti** i pattern (enabled + disabled) con campo `enabled`
  - `POST /api/cleanup/patterns` - Aggiungi pattern custom
  - `DELETE /api/cleanup/patterns/:id` - Elimina pattern custom (non default)
  - `PUT /api/cleanup/patterns/:id/toggle` - Enable/disable pattern
  - `GET /api/cleanup/stats` - Statistiche cleanup
- **Attori Predefiniti** (89 totali - aggiornato):
  - 16 attori italiani: Alberto Sordi, Totò, Adriano Celentano, Massimo Troisi, Carlo Verdone, ecc.
  - 73 attori internazionali: Adam Sandler, Al Pacino, Tom Cruise, Brad Pitt, Leonardo DiCaprio, Antonio Banderas, Anthony Hopkins, Jean-Claude Van Damme, ecc.
- **Esempi di pulizia**:
  - "Alberto Sordi Dove vai in vacanza? (1978)" → "Dove vai in vacanza? (1978)"
  - "Adam Sandler 50 volte il primo bacio (2004)" → "50 volte il primo bacio (2004)"
  - "Totò 47 morto che parla (1950)" → "47 morto che parla (1950)"
  - "Bruce Willis Acts of Violence (2018)" → "Acts of Violence (2018) [2]" (se duplicato)
- **Performance**: Analisi completa di 30k film in ~2-3 secondi
- **Error Handling**: Toast con warning se cleanup parziale, dettagli errori in console browser

### **Fase 5.2** - Multi-Library Year Organization (100%) 🆕
- **📅 Organizzazione automatica film per periodi anno** con sottocartelle configurabili
- **Database**: Tabella `year_libraries` con 5 configurazioni default (Pre-1980, 1980-2000, 2001-2020, 2021+, Unknown Year)
- **Backend Service**: `yearLibraryService.js` per matching automatico film → library basato su anno estratto
- **API Endpoints** (9 endpoints):
  - `GET /api/year-libraries` - Lista tutte le year libraries con sort order
  - `GET /api/year-libraries/config` - Ottieni stato enable/disable year organization
  - `PUT /api/year-libraries/config` - Toggle year organization globale
  - `POST /api/year-libraries` - Crea nuova year library
  - `PUT /api/year-libraries/:id` - Modifica year library
  - `DELETE /api/year-libraries/:id` - Elimina year library
  - `PUT /api/year-libraries/:id/toggle` - Enable/disable singola library
  - `PUT /api/year-libraries/reorder` - Riordina libraries (drag & drop)
  - `GET /api/year-libraries/stats` - Statistiche distribuzione film per library
- **UI Features**:
  - Tab "Year Libraries" in MoviesView con interfaccia completa
  - Toggle master per enable/disable year organization
  - CRUD completo year libraries con validazione range anni
  - Preview statistiche distribuzione (total, organized, unorganized, coverage %)
  - Indicatori visivi per ogni library (nome, range, directory, movie count)
  - Enable/disable toggle per singole libraries
- **File Organization**:
  - Struttura FLAT (default): `/{baseDir}/{movie_name}/{movie_name}.strm`
  - Struttura YEAR-BASED (enabled): `/{baseDir}/{year_library}/{movie_name}/{movie_name}.strm`
  - Esempio: `/app/data/movies/2001-2020/Inception (2010)/Inception (2010).strm`
- **Auto-Detection**: Estrazione automatica anno dal nome film con regex `\((\d{4})\)`
- **Fallback Handling**: Film senza anno valido → library "Unknown Year"
- **Compatibilità**: Completamente backward-compatible, disabilitabile senza perdita dati

### **Fase 5.3** - Emby Integration Improvement (100%) 🆕
- **🎬 Refresh globale tutte le librerie Emby** con configurazione semplificata
- **Modifiche Backend** (migration 013):
  - Rimosso campo `emby_library_id` non più necessario
  - Endpoint `/api/movies/emby-refresh` usa `/emby/Library/Refresh` (endpoint globale Emby)
  - Configurazione richiede solo `emby_server_url` e `emby_api_token`
- **API Endpoints** (3 endpoints):
  - `GET /api/movies/emby-config` - Ottieni configurazione Emby (solo server URL e token)
  - `PUT /api/movies/emby-config` - Salva configurazione Emby (validazione semplificata)
  - `POST /api/movies/emby-refresh` - Trigger refresh globale tutte le librerie
- **UI Migliorata**:
  - Rimosso campo "Library ID" dall'interfaccia (configurazione più semplice)
  - Pulsante "Refresh All Libraries" aggiorna tutte le librerie contemporaneamente
  - Tooltip e descrizione aggiornati per chiarire comportamento globale
- **Benefici**:
  - Configurazione più semplice (solo 2 campi invece di 3)
  - Nessun bisogno di trovare ID libreria specifica
  - Aggiornamento più efficiente di tutte le librerie con un solo click
- **Backward Compatibility**: Migration automatica rimuove vecchio `emby_library_id` dal database

### **Fase 5.4** - Subtitle Backup System (100%) 🆕
- **🎬 Sistema automatico di backup/restore file .srt** per preservare sottotitoli scaricati da Emby
- **Problema risolto**: Quando deseleziono una categoria di film e i file `.strm` vengono cancellati, anche i sottotitoli `.srt` scaricati da Emby vengono persi
- **Soluzione**: Backup automatico `.srt` prima della cancellazione + restore automatico alla rigenerazione
- **Backup Structure** (FLAT):
  - Directory: `{moviesDirectory}/.subtitles_backup/`
  - Organizzazione: `{movie_name}/` (nome film come chiave univoca)
  - Esempio: `.subtitles_backup/Inception (2010)/Inception (2010).en.srt`
  - Indipendente da Year Libraries (funziona con qualsiasi configurazione)
- **Funzioni implementate** in `movieService.js`:
  - `backupSubtitles(movieDir)` - Copia file `.srt` in backup prima cancellazione
  - `restoreSubtitles(movieDir)` - Ripristina file `.srt` dal backup dopo creazione
- **Integrazione**:
  - `deleteStrmFile()` - Backup automatico prima di `fs.rm()`
  - `createStrmFile()` - Restore automatico dopo `fs.writeFile()`
  - `syncFilesystemFromDb()` - Backup/restore durante sync massivo
- **Ripristino parziale**:
  - Cancello 1000 film → 1000 backup creati
  - Ripristino 300 film → 300 sottotitoli ripristinati
  - **Rimangono 700 backup disponibili** per futuri ripristini selettivi
- **Caratteristiche**:
  - ✅ Preserva sottotitoli durante cancellazione/ripristino film
  - ✅ Funziona con ripristini parziali (backup persistente per film non ancora ripristinati)
  - ✅ Non sovrascrive sottotitoli esistenti (safe)
  - ✅ Compatibile con Year Libraries e struttura FLAT
  - ✅ Logging dettagliato per debug
  - ✅ Silenzioso quando non ci sono backup (nessun errore)
  - ✅ Nessuna migration database richiesta (backward compatible)
- **Documentazione**: Vedi [SUBTITLE_BACKUP.md](SUBTITLE_BACKUP.md) per dettagli completi e FAQ

---

## 📅 Fasi Future

### Fase 3.2 - Gestione Serie TV
**Status**: ❌ Non iniziata

**Obiettivo**: Gestione completa serie TV con stagioni/episodi e file `.strm`

#### Requisiti
- [ ] Riconoscere serie da M3U (URL pattern `/series/`)
- [ ] Database extension per serie/stagioni/episodi
- [ ] Parser per estrarre metadati (titolo, stagione, episodio)
- [ ] Generazione `.strm` con struttura gerarchica (`{serie}/{stagione}/S01E01.strm`)
- [ ] SeriesView con raggruppamento per serie/stagioni
- [ ] Job queue asincrono per generazione batch

#### Complessità
- **Alta**: Richiede parser intelligente per formati inconsistenti
- **Priorità**: Media (molti utenti hanno solo canali TV)

---

### Fase 5 - Ricerca e Filtri
**Status**: 🟡 In Corso (50% completata)

**Obiettivo**: Ricerca globale e filtri avanzati

#### 5.1 Frontend Search (✅ Completato)
- [x] **Barra ricerca globale su ManageView**
  - Search bar con icona e clear button
  - Filtro real-time su nome canale, tvg-id e logo URL
  - Counter "Showing X of Y channels"
  - Gruppi senza match nascosti automaticamente
  - Auto-expand gruppi con risultati
  - Messaggio "No results found" con clear action
- [ ] Ricerca real-time su MoviesView

#### 5.2 Backend Search API (❌ Non necessario per v1)
- [ ] Endpoint `/api/channels/search?q=query` (opzionale - filtro frontend sufficiente)
- [ ] Full-text search database-side (performance optimization)

#### 5.3 Filtri Avanzati (❌ Non iniziati)
- [ ] Filtri sidebar per gruppo
- [ ] Filtri per stato (exported/hidden)
- [ ] Filtri per modifiche (overridden channels)
- [ ] Combinazione multipla filtri

---

### Fase 6 - Testing e QA
**Status**: ❌ Non iniziata

#### 6.1 Automated Testing
- [ ] Unit tests (parser M3U, services) - Coverage > 80%
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (import/export flow)

#### 6.2 Mobile & Responsive Design
- [ ] Verificare UI responsive (320px - 768px)
- [ ] Test touch gestures (tap, swipe, long-press)
- [ ] Test modali e dropdown su schermi piccoli
- [ ] Verificare drag & drop su touch devices
- [ ] Test su dispositivi reali (iOS Safari, Chrome Mobile)

**Priorità**: Alta - molti utenti potrebbero gestire IPTV da mobile

---

### Fase 7 - Documentazione
**Status**: ❌ Non iniziata

- [ ] API documentation (Swagger/OpenAPI)
- [ ] User guide con screenshots
- [ ] Developer guide (architettura, contributi)
- [ ] Deployment guide avanzato
- [ ] Troubleshooting common issues

---

### Fase 8 - Produzione
**Status**: ❌ Non iniziata

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker Hub automated builds
- [ ] Health checks e monitoring
- [ ] Backup automatico database
- [ ] Performance optimization

---

## 🎓 Decisioni Architetturali

### 1. Matching Canali: Solo `tvg_id`
**Decisione**: Il matching tra import successivi avviene SOLO tramite `tvg_id`

**Motivazione**: L'URL può cambiare tra import diversi

**Implicazioni**:
- Canali senza `tvg_id` riceveranno un ID generato
- Duplicati tvg-ID gestiti con modal strategia (replace/rename/skip)

### 2. Storicità: Imported vs Custom Fields
**Decisione**: Separare valori importati da valori personalizzati

**Schema**:
```sql
imported_tvg_name TEXT,    -- Sempre aggiornato dall'import
custom_tvg_name TEXT,       -- Impostato dall'utente, preservato
is_name_overridden INTEGER  -- Flag per sapere quale usare
```

**Benefici**:
- Tracciabilità completa delle modifiche
- Possibilità di reset a valori originali
- Visibilità modifiche in UI

### 3. Container Singolo
**Decisione**: Un solo container per backend + frontend

**Trade-off**:
- ✅ Deploy semplice, meno risorse
- ❌ Meno scalabilità (ok per uso personale/domestico)

### 4. SQLite vs PostgreSQL
**Decisione**: SQLite per semplicità

**Quando migrare a PostgreSQL**:
- Uso multi-utente concorrente
- Migliaia di canali (10k+)
- Deploy cloud con necessità scalabilità

### 5. Nessuna Autenticazione
**Decisione**: Nessuna autenticazione per MVP

**Motivazione**: Uso su rete locale/personale

**Quando aggiungere**: Esposizione su Internet o multi-utente

### 6. Struttura FLAT per Movies (con Year Organization opzionale)
**Decisione**: File `.strm` con struttura `{movie_name}/{movie_name}.strm` (NO group-title in path)

**Motivazione**:
- Compatibilità con media server (Jellyfin, Plex)
- Evita path troppo lunghi (Windows 260 char limit)
- Group-title può cambiare, nome film no

**Year Organization** (v0.9.4+):
- Opzionale: `{year_library}/{movie_name}/{movie_name}.strm`
- Toggle globale enable/disable senza perdita dati
- Configurazione year_libraries parametrica e personalizzabile
- Migliora organizzazione e browsing per grandi collezioni (30k+ film)

---

## 📝 Note Tecniche

### Import M3U - Parser Behavior
- Riconosce solo linee `#EXTINF:`
- Estrae: `tvg-ID`, `tvg-name`, `tvg-logo`, `group-title`
- URL sulla riga successiva
- Tipo canale da URL:
  - `/movie/` → film (importato in tabella `movies`)
  - `/series/` → serie TV (ESCLUSO per ora)
  - Altro → TV channel (importato in tabella `channels`)

### Import Asincrono - Async Batch Processing
- **Batch size**: 500 items per batch (configurabile)
- **Non-blocking**: Usa `setImmediate()` tra batch per yield event loop
- **Progress tracking**: Job queue con polling frontend (500ms)
- **Transazioni**: SQLite transaction per batch (rollback su errore)
- **Performance**: 30k movies importati in ~20s senza bloccare server
- **Endpoint**: Restituisce `jobId` immediatamente, import procede in background

### Export M3U - Generator Logic
```javascript
const name = is_name_overridden ? custom_tvg_name : imported_tvg_name;
const logo = is_logo_overridden ? custom_tvg_logo : imported_tvg_logo;
const group = group_title.name; // Usa sempre nome gruppo corrente
```

### Database Migrations
- Auto-eseguite all'avvio del server
- Tracciamento in tabella `migrations`
- Idempotenti (safe per re-run)

### Volume Docker
```
./data:/app/data
```
- `database.sqlite` - Database persistente
- `output/playlist.m3u` - File export generati
- `epg/guide.xml` - EPG XML
- `movies/*.strm` - File stream film

### EPG Grabber
- Embedded nell'immagine Docker (`/app/epg-grabber`)
- Sorgenti EPG: 505 channels da `epg-grabber/sites/*.channels.xml`
- Custom channels generato da mapping: `/app/data/epg/custom.channels.xml`
- Grab ottimizzato: solo canali matched (93% tempo risparmiato)

---

## 🐛 Known Issues

### Bug #1: Checkbox Bulk Selection - Ultimo Elemento Non Si Aggiorna Visivamente
**Status**: 🔴 Open | **Priorità**: Media

**Descrizione**: Durante Shift+Click in Bulk Edit Mode, l'ultimo elemento del range non aggiorna visivamente la checkbox (ma la selezione viene registrata).

**Workaround**: Click singolo sull'ultimo elemento o double-click dopo Shift+Click

**Root Cause**: Interazione tra `preventDefault()` e reattività Vue 3 su proprietà dinamiche

---

### Bug #2: Nuovo Gruppo Creato Va in Fondo Invece che in Testa
**Status**: 🔴 Open | **Priorità**: Bassa

**Descrizione**: Nuovo gruppo inserito alla fine della lista invece che in prima posizione

**Workaround**: Drag & drop per riposizionare

**Fix Suggerito**: Incrementare `sort_order` di tutti i gruppi esistenti prima di inserire il nuovo con `sort_order = 0`

---

### Bug #5: EPG Sources - Modale Non Si Chiude e Lista Non Si Aggiorna
**Status**: 🔴 Open | **Priorità**: Media

**Descrizione**: Dopo add/delete EPG source, la modale non si chiude e la lista non si aggiorna fino a refresh manuale (F5)

**Workaround**: Refresh manuale della pagina

**Fix Suggerito**: Chiamare `loadEpgSources()` dopo success e chiudere modale solo dopo aggiornamento completato

---

### Bug #6: Movies Page Shows 0 After Import Until Manual Refresh
**Status**: 🔴 Open | **Priorità**: Bassa

**Descrizione**: Dopo import film, navigando a Movies page mostra "0 movies" fino a refresh manuale

**Root Cause**: Vue Router keep-alive usa cache e non ricarica dati

**Fix Suggerito**: Usare `onActivated` hook in MoviesView per ricaricare dati quando la pagina viene riattivata

---

### Bug #7: NFS Cache Prevents Immediate File Visibility (RISOLTO ✅)
**Status**: 🟢 Resolved | **Priorità**: Critica | **Risolto**: 2025-10-22

**Descrizione**: File `.strm` creati dal container Docker su mount NFS non erano immediatamente visibili, causando mismatch tra database (1337 record) e filesystem scan (1311-1329 file). I file esistevano fisicamente ma `readdir()` non li vedeva a causa della cache NFS metadata.

**Sintomi**:
- `fs.writeFile()` completava con successo
- `fs.stat()` sul file appena creato funzionava
- `fs.readdir()` sulla directory parent non mostrava il file
- `find` dall'host vedeva tutti i file, ma il container ne vedeva meno

**Root Cause**: NFS attribute caching e readdir caching impedivano la visibilità immediata dei metadata delle directory dopo la creazione di nuovi file.

**Soluzione Implementata**:

1. **Modifica codice** (`movieService.js`):
   - Aggiunto `fsync()` sul file dopo `writeFile()` per flush buffer NFS
   - Aggiunto `fsync()` sulla directory parent per forzare aggiornamento metadata

2. **Configurazione NFS mount** (`/etc/fstab`):
   ```
   noac,actimeo=0,lookupcache=none,nordirplus
   ```
   - `noac` - Disabilita attribute caching
   - `actimeo=0` - Timeout cache attributi a 0 secondi
   - `lookupcache=none` - Nessuna cache per lookup
   - `nordirplus` - Disabilita READDIRPLUS caching

3. **Endpoint diagnostici** aggiunti:
   - `GET /api/movies/detect-duplicates` - Rileva duplicati considerando year libraries
   - `GET /api/movies/verify-strm-files` - Verifica esistenza file con `fs.stat()`
   - `GET /api/movies/filesystem-scan` - Scan ricorsivo completo filesystem
   - `GET /api/movies/path-mismatch` - Confronto diretto path DB vs filesystem

**Risultato**: ✅ 1337/1337 file visibili immediatamente dopo creazione

**Note**: Entrambe le soluzioni (codice + mount options) sono necessarie per affidabilità completa su NFS.

---

## 💡 Idee Future (Backlog)

### UX Improvements
- [ ] Dark/Light mode themes
- [ ] Drag & drop file upload (già implementato su ImportView)
- [ ] Keyboard shortcuts (es: `Ctrl+S` per export)

### Features
- [ ] Supporto multi-lingua (i18n)
- [ ] Import automatico schedulato (cron)
- [ ] Backup/restore database automatico
- [ ] Export in altri formati (JSON, XML, XSPF)
- [ ] API REST pubblica (per integrazione con altre app)
- [ ] Statistiche utilizzo canali (most watched)
- [ ] Preferiti/Watchlist
- [ ] Integrazione Jellyfin/Plex API

### Advanced
- [ ] Mobile app (React Native?)
- [ ] Multi-user support con autenticazione
- [ ] Streaming proxy (per canali con IP whitelist)

---

## 📞 Comandi Rapidi

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Docker
```bash
# Build e start
docker-compose up -d --build

# Logs
docker logs iptv-manager -f

# Stop
docker-compose down

# Restart (preserva dati)
docker-compose restart
```

### Database
```bash
# Accedi al database (from container)
docker exec -it iptv-manager sqlite3 /app/data/database.sqlite

# Check database contents
docker exec iptv-manager sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM channels;"

# Reset completo database (Windows)
.\reset-database.ps1

# Reset completo database (Linux/Mac)
./reset-database.sh
```

> ⚠️ **IMPORTANTE**: `docker-compose down && docker-compose up` **NON resetta** il database!
> Il file `./data/database.sqlite` persiste nel volume Docker.
> Per reset, usa i pulsanti nella UI oppure cancella manualmente `./data/`

### Test
```bash
# Import file di test
curl -X POST -F "file=@test-playlist.m3u" http://localhost:3000/api/import/upload

# Export
curl -X POST http://localhost:3000/api/export

# Download playlist
curl http://localhost:3000/output/playlist.m3u
```

### Production Deploy
```bash
# Deploy con docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Deploy su server (pull da Docker Hub)
docker-compose -f docker-compose-production.yml up -d
```

Vedi [DEPLOYMENT.md](DEPLOYMENT.md) e [QUICKSTART.md](QUICKSTART.md) per dettagli deployment completo.

---

## 📚 Riferimenti

- 📜 [HISTORY.md](HISTORY.md) - Changelog dettagliato e note di rilascio
- 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) - Guida deployment produzione
- ⚡ [QUICKSTART.md](QUICKSTART.md) - Quickstart guide
- 🗄️ [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md) - Gestione database
- 📖 [EPG_MATCHING_GUIDE.md](EPG_MATCHING_GUIDE.md) - Guida EPG matching system
- 💾 [SUBTITLE_BACKUP.md](SUBTITLE_BACKUP.md) - Sistema backup/restore sottotitoli

---

**Ultimo aggiornamento**: 2025-10-22
**Prossima revisione**: Dopo completamento Fase 5 o Fase 3.2
