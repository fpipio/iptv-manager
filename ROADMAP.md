# 🗺️ IPTV Manager - Development Roadmap

> **IMPORTANTE**: Questo file è la **guida centrale** del progetto. Deve essere **aggiornato automaticamente** ad ogni completamento di task, modifica architetturale o decisione importante. Non aspettare che venga richiesto - aggiornalo proattivamente.

---

## 📋 Indice

- [Stato Attuale](#stato-attuale)
- [Architettura](#architettura)
- [Fasi Completate](#fasi-completate)
- [Fasi in Corso](#fasi-in-corso)
- [Fasi Future](#fasi-future)
- [Decisioni Architetturali](#decisioni-architetturali)
- [Note Tecniche](#note-tecniche)

---

## 🎯 Stato Attuale

**Ultimo Aggiornamento**: 2025-10-20 12:30

**Fase Corrente**: ✅ **Fase 3.1 Completata** - Movies Management con Group-Title Support (100%)
  - ✅ Database migration con tabella `movies` + group_title support
  - ✅ Parser M3U esteso per riconoscere film (URL pattern `/movie/`)
  - ✅ Generazione automatica file .strm con struttura FLAT
  - ✅ **Job Queue asincrono** per operazioni filesystem non bloccanti
  - ✅ **Progress tracking in tempo reale** con barra animata
  - ✅ Group-title categorization con checkbox inline
  - ✅ Sync automatico durante import (crea/aggiorna/cancella)
  - ✅ Pagina Movies con caricamento progressivo ottimizzato
  - ✅ API completa per gestione film (15+ endpoints)
  - ✅ Stats: totale film, file .strm creati, directory
  - ✅ Filesystem re-scan per recupero file mancanti
  - ✅ **Keep-alive routing** per navigazione istantanea

**Prossima Fase**: Fase 3.2 - Gestione Serie TV (o Fase 5 - Ricerca e Filtri)

### Funzionalità Operative
- ✅ Import M3U (file upload + URL)
- ✅ Gestione gruppi (CRUD completo con modali)
- ✅ Gestione canali (CRUD completo con modali)
- ✅ **Gestione film con generazione .strm files**
- ✅ Storicità modifiche
- ✅ Export M3U
- ✅ Server HTTP per playlist
- ✅ Container Docker funzionante
- ✅ Drag & Drop riordinamento gruppi
- ✅ Drag & Drop riordinamento canali (solo stesso gruppo)
- ✅ Bulk Edit Mode con toggle button
- ✅ Selezione multipla canali
- ✅ Shift-Click per selezione range contigui
- ✅ Bulk move canali tra gruppi
- ✅ Toast notifications system
- ✅ Visual indicators per canali personalizzati
- ✅ Checkbox toggle senza reload pagina
- ✅ EPG Multi-Source Matching System
- ✅ Auto-matching intelligente canali → EPG
- ✅ Custom channels XML generation
- ✅ Grab EPG ottimizzato (solo canali matched)
- ✅ Settings page con info EPG sources e output streams URLs

### Funzionalità Mancanti
- ❌ Gestione Serie TV
- ❌ Ricerca e filtri
- ❌ Schedulazione automatica EPG (opzionale)

---

## 🏗️ Architettura

### Stack Tecnologico
- **Backend**: Node.js 20 + Express
- **Frontend**: Vue.js 3 + Vite + TailwindCSS
- **Database**: SQLite (file-based)
- **Container**: Docker (single container, multi-stage build)
- **Deployment**: Docker Compose

### Struttura Database

**Tabella `channels`**:
- `imported_*` fields: Valori originali dall'ultimo import
- `custom_*` fields: Valori modificati dall'utente
- `is_*_overridden` flags: Traccia cosa è stato personalizzato
- Matching: Solo tramite `tvg_id`

**Tabella `group_titles`**:
- Gruppi personalizzabili
- Ordinabili tramite `sort_order`
- Esportabili tramite `is_exported`

**Tabella `movies`**:
- Gestione film semplificata (no custom fields, no gruppi)
- Matching: Tramite `tvg_name` (nome univoco)
- Campi: tvg_name, tvg_logo, url, folder_path, strm_file_path
- Tracking: last_seen_at per rilevare film obsoleti

### Logica Storicità

**Canali TV**:
```
Import → Cerca canale per tvg_id
  ├─ Esiste?
  │   ├─ Aggiorna imported_* fields
  │   └─ PRESERVA custom_* fields se overridden
  └─ Nuovo?
      └─ Crea con valori default
```

**Film**:
```
Import → Cerca film per tvg_name
  ├─ Esiste?
  │   ├─ Aggiorna last_seen_at
  │   └─ Verifica file .strm (ricrea se mancante)
  └─ Nuovo?
      ├─ Crea record DB
      ├─ Crea cartella /movies/{nome_film}/
      └─ Genera file {nome_film}.strm con URL

Cleanup → Film non nel feed
  ├─ Cancella file .strm
  ├─ Cancella cartella
  └─ Rimuovi da DB
```

---

## ✅ Fasi Completate

### Fase 0 - Pianificazione (2025-10-17)
**Status**: ✅ Completata

- ✅ Definizione requisiti
- ✅ Scelte architetturali
- ✅ Design database schema
- ✅ Definizione API endpoints

**Decisioni Prese**:
- Database: SQLite (semplicità deployment)
- Frontend: Vue.js (richiesta utente)
- Container: Singolo container (semplicità)
- Matching canali: Solo `tvg_id`
- Autenticazione: Nessuna (rete locale)

---

### Fase 1 - Setup Base (2025-10-17)
**Status**: ✅ Completata

#### 1.1 Struttura Progetto ✅
- ✅ Directory backend/frontend
- ✅ package.json per entrambi
- ✅ Configurazioni Vite + Tailwind
- ✅ .gitignore e .dockerignore

#### 1.2 Database ✅
- ✅ SQLite setup
- ✅ Migration system
- ✅ Schema iniziale (001_initial_schema.sql)
- ✅ Database helper

#### 1.3 Backend API ✅
**Routes**:
- ✅ `/api/groups` - CRUD gruppi
- ✅ `/api/channels` - CRUD canali
- ✅ `/api/import/upload` - Upload file
- ✅ `/api/import/url` - Import da URL
- ✅ `/api/export` - Genera M3U
- ✅ `/api/export/preview` - Preview M3U

**Services**:
- ✅ `m3uParser.js` - Parse M3U format
- ✅ `importService.js` - Logica import con storicità
- ✅ `exportService.js` - Genera M3U da DB

#### 1.4 Frontend Vue.js ✅
**Views**:
- ✅ `ImportView.vue` - Upload/URL import UI
- ✅ `ManageView.vue` - Lista gruppi e canali
- ✅ `ExportView.vue` - Export e preview

**Features**:
- ✅ Vue Router setup
- ✅ Tailwind styling
- ✅ Axios per API calls
- ✅ Form validazione base

#### 1.5 Docker ✅
- ✅ Dockerfile multi-stage (frontend build + backend runtime)
- ✅ docker-compose.yml
- ✅ Volume per persistenza dati
- ✅ Porta 3000 esposta

#### 1.6 Testing ✅
**Test Completati**:
- ✅ Build Docker image
- ✅ Container startup
- ✅ Migrations esecuzione
- ✅ Import 4 canali TV (test-playlist.m3u)
- ✅ Modifica nome canale
- ✅ Re-import preserva modifiche
- ✅ Export con nome personalizzato
- ✅ Persistenza dati nel volume
- ✅ Accessibilità frontend (http://localhost:3000)
- ✅ Accessibilità API
- ✅ Download M3U (http://localhost:3000/output/playlist.m3u)

**File di Test**:
- `test-playlist.m3u` - 4 canali TV + 2 serie (escluse)

**Risultati Test Storicità**:
```
1. Import iniziale: 4 canali creati
2. Modifica: Rai 1 HD → "RAI UNO PERSONALIZZATO"
3. Re-import: Nome preservato ✅
4. Export: Usa nome personalizzato ✅
```

---

## 🔄 Fasi in Corso

**Nessuna fase attualmente in corso**

---

## 📅 Fasi Future

### Fase 2 - Funzionalità Avanzate UI
**Status**: ✅ **Completata** (2025-10-17)

**Obiettivo**: Rendere l'UI completamente funzionale con tutte le operazioni CRUD

#### 2.1 Modali Edit ✅
- [x] Modale edit gruppo
  - [x] Rinomina gruppo
  - [x] Toggle export
  - [x] Elimina gruppo (con conferma)
  - [x] Statistiche gruppo (data creazione, numero canali)
- [x] Modale edit canale
  - [x] Modifica nome personalizzato
  - [x] Modifica logo personalizzato
  - [x] Cambia gruppo di appartenenza
  - [x] Toggle export
  - [x] Reset modifiche (torna a valori imported)
  - [x] Preview logo
  - [x] Visualizza valori originali vs custom

#### 2.2 Drag & Drop Riordinamento ✅
**Libreria**: `vuedraggable`

- [x] Drag & Drop gruppi
  - [x] Riordina gruppi nella lista
  - [x] Salva nuovo ordine (PUT /api/groups/reorder/all)
  - [x] Visual feedback con drag handle
- [x] Drag & Drop canali
  - [x] Riordina canali dentro un gruppo
  - [x] Salva nuovo ordine (PUT /api/channels/reorder/group)
  - [x] ~~Drag cross-group~~ Rimosso (scomodo) → sostituito con Bulk Edit

#### 2.3 Selezione Multipla ✅
- [x] **Bulk Edit Mode toggle button** (attiva/disattiva modalità bulk)
- [x] Checkbox selezione condizionali (visibili solo in bulk mode)
- [x] Selezione singola canali
- [x] **Shift-Click per selezione range contigui**
- [x] Counter selezioni per gruppo
- [x] Azioni bulk:
  - [x] **Bulk move canali tra gruppi**
  - [x] Modale scelta gruppo destinazione
  - [x] Toast conferma operazione
  - [ ] Export multiplo (future)
  - [ ] Hide multiplo (future)
  - [ ] Elimina multipli (future)
- [ ] Checkbox "Select All" per gruppo (future)

**Miglioramenti UX**:
- Interfaccia pulita quando bulk mode disattivo
- Due checkbox distinti: viola (selezione) e blu (export)
- Clear automatico selezioni quando si esce da bulk mode
- Shift-Click funziona solo nello stesso gruppo

#### 2.4 UX Improvements ✅
- [x] Toast notifications (successo/errore)
- [x] Conferme per azioni distruttive
- [x] Indicatori visivi per canali modificati (stella ★)
- [x] **Checkbox toggle senza reload pagina** (aggiornamento stato locale)
- [x] **Bulk Edit Mode toggle per interfaccia pulita**
- [x] Tooltip informativi sui checkbox
- [ ] Loading states (future)
- [ ] Statistiche dashboard (future)

**Componenti Creati**:
- `ChannelEditModal.vue`
- `GroupEditModal.vue`
- `ToastNotification.vue`
- `useToast.js` composable

**Bug Fix Importanti**:
- ✅ Fix reload pagina su checkbox toggle
- ✅ Rimosso drag cross-group confusionario
- ✅ Interfaccia bulk edit separata con toggle

---

### Fase 3 - Gestione Film
**Status**: ✅ **Completata** (2025-10-20)

**Obiettivo**: Gestione completa film con generazione automatica file .strm e job queue asincrono

#### 3.1 Database Extension ✅
- [x] Migration 005_movies_support.sql
- [x] Migration 006_movies_group_support.sql (group_title column)
- [x] Migration 007_movies_strm_tracking.sql (strm_enabled tracking)
- [x] Tabella `movies` con campi essenziali + group_title
- [x] Matching basato su `tvg_name` (univoco)
- [x] Tracking `last_seen_at` per cleanup automatico
- [x] Tracking `strm_enabled` per stato STRM files
- [x] Configurazione path directory in `epg_config`

#### 3.2 Backend Services ✅
- [x] `movieService.js` - Gestione completa film con struttura FLAT
  - [x] `syncMoviesFromM3u()` - Sync automatico durante import (DB only)
  - [x] `syncFilesystemFromDb()` - Sync filesystem da DB con preview
  - [x] `createStrmFile()` - Genera cartella + file .strm (FLAT structure)
  - [x] `deleteStrmFile()` - Cleanup cartella + file
  - [x] `getAllMovies()` - Lista con filtri, search e paginazione
  - [x] `getMoviesStats()` - Statistiche (totale, .strm count, directory)
  - [x] `rescanFilesystem()` - Recupera file .strm mancanti
  - [x] `sanitizeFilename()` - Normalizza nomi per filesystem
- [x] `jobQueue.js` - **Nuovo**: Sistema job queue in-memory
  - [x] Gestione job asincroni (pending → running → completed/failed/cancelled)
  - [x] Progress tracking in tempo reale
  - [x] Auto-cleanup job vecchi (1 ora retention)
  - [x] Batch processing (50 file alla volta)
- [x] Parser M3U esteso per riconoscere film e estrarre group-title
- [x] Import service integrato con sync automatico separato (channels/movies)

#### 3.3 API Routes ✅
- [x] `GET /api/movies` - Lista film con filtri e paginazione (default 100, con total count)
- [x] `GET /api/movies/stats` - Statistiche (conta STRM files su disco)
- [x] `GET /api/movies/:id` - Dettaglio singolo
- [x] `DELETE /api/movies/:id` - Cancella film + .strm
- [x] `GET /api/movies/config` - Get directory path
- [x] `PUT /api/movies/config` - Set directory path
- [x] `POST /api/movies/rescan` - Re-scan filesystem
- [x] `POST /api/movies/sync-filesystem` - Sync filesystem da DB (con dry-run)
- [x] `POST /api/movies/toggle-strm-group` - **Asincrono**: Toggle STRM per gruppo (restituisce jobId)
- [x] `GET /api/movies/jobs/:jobId` - **Nuovo**: Recupera progress job in tempo reale
- [x] `DELETE /api/movies/jobs/:jobId` - **Nuovo**: Cancella job in esecuzione

#### 3.4 Frontend UI ✅
- [x] `MoviesView.vue` - Pagina completa gestione film con UX avanzata
  - [x] Stats cards (totale, .strm files, directory)
  - [x] **Caricamento progressivo ottimizzato** (batch 1000, stats in background)
  - [x] **Progress bar animata** durante caricamento (gradient blu-viola)
  - [x] Raggruppamento per group-title con collapse/expand
  - [x] **Checkbox inline per STRM generation** (toggle nel group header)
  - [x] **Progress bar inline per job** (percentuale + contatore + cancel button)
  - [x] **Polling automatico** job progress ogni 1 secondo
  - [x] **Aggiornamento in-memory** (no reload completo dopo job)
  - [x] Search bar real-time
  - [x] Actions: View URL, Delete, Re-scan
  - [x] URL modal con copy to clipboard
  - [x] Responsive design (TailwindCSS)
- [x] Router integration (`/movies`)
- [x] **Keep-alive caching** per navigazione istantanea
- [x] Navigation menu updated (Import | Manage | **Movies** | Export | EPG Matching | Settings)

#### 3.5 Filesystem Management ✅
- [x] **Struttura FLAT**: `/app/data/movies/{nome_film}/{nome_film}.strm` (NO group-title in path!)
- [x] File .strm contiene solo URL stream
- [x] Sanitizzazione nomi (rimuove caratteri illegali, normalizza spazi)
- [x] Auto-cleanup film obsoleti (non più nel feed) con bulk DELETE ottimizzato
- [x] Recovery automatico file mancanti
- [x] **Job queue per operazioni async** (batch 50 file, delay 10ms tra batch)
- [x] **Operazioni cancellabili** durante esecuzione

**Test Results**:
- ✅ Import 6 film da test M3U con group-title
- ✅ Struttura FLAT verificata (no sottocartelle per gruppo)
- ✅ File .strm generati con URL corretti
- ✅ Re-import preserva film esistenti
- ✅ Cleanup funzionante (1973 film eliminati in 0.3s con bulk DELETE)
- ✅ Job asincrono testato: 1761 file creati in 47 secondi (37 file/sec)
- ✅ Progress bar in tempo reale funzionante
- ✅ Cancellazione job testata e funzionante
- ✅ Keep-alive: navigazione Movies ↔ Manage istantanea
- ✅ Caricamento 33,393 film con progress bar (5-10 sec totali)

**File Creati**:
- `backend/src/db/migrations/005_movies_support.sql`
- `backend/src/db/migrations/006_movies_group_support.sql` (**nuovo**)
- `backend/src/db/migrations/007_movies_strm_tracking.sql` (**nuovo**)
- `backend/src/services/movieService.js`
- `backend/src/services/jobQueue.js` (**nuovo** - 160 righe)
- `backend/src/routes/movies.js`
- `frontend/src/views/MoviesView.vue`
- `test-movies.m3u` (file test con 6 film)

**File Modificati**:
- `backend/src/services/m3uParser.js` (estrae group-title)
- `backend/src/services/importService.js` (import separato channels/movies)
- `backend/src/routes/import.js` (4 nuovi endpoint separati)
- `backend/src/server.js` (route movies)
- `frontend/src/main.js` (route `/movies`)
- `frontend/src/App.vue` (navigation menu + **keep-alive routing**)
- `frontend/src/views/ImportView.vue` (dual-tab interface)

---

### Fase 3.2 - Gestione Serie TV
**Status**: ❌ Non iniziata

**Obiettivo**: Estendere la gestione alle serie TV con stagioni/episodi

#### 3.2.1 Database Extension (Future)
- [ ] Tabella `series` (metadati serie)
- [ ] Tabella `episodes` (singoli episodi)
- [ ] Campi: season, episode, year, etc.

#### 3.2.2 Import Logic (Future)
- [ ] Riconosci serie da URL pattern (`/series/`)
- [ ] Parsing stagioni/episodi da nome
- [ ] Raggruppamento automatico per serie

#### 3.2.3 UI Views (Future)
- [ ] Pagina dedicata Serie TV
  - [ ] Lista serie
  - [ ] Espandi stagioni
  - [ ] Episodi ordinati

---

### Fase 4 - Integrazione EPG (Electronic Program Guide)
**Status**: ✅ **Completata** (2025-10-17/18)

**Obiettivo**: Integrare guida TV con supporto per EPG grabber esterno

---

### Fase 4.5 - EPG Multi-Source Matching System
**Status**: ✅ **Completata** (2025-10-18)

**Obiettivo**: Sistema intelligente di matching tra canali M3U e sorgenti EPG multiple per grab ottimizzato

#### 4.1 Setup EPG Package ✅
- [x] Studiare documentazione @iptv-org/epg
- [x] Progettare architettura integrazione
- [x] Installare iptv-org/epg in epg-grabber/

#### 4.2 Database Extension ✅
- [x] Tabella `epg_sources` (sorgenti EPG configurabili)
- [x] Tabella `epg_grab_logs` (storico grab)
- [x] Tabella `epg_config` (configurazione globale)
- [x] Migration 003_epg_tables.sql

#### 4.3 Backend Services ✅
- [x] `epgService.js` - Gestione EPG completa con grab reale
  - [x] CRUD sorgenti EPG
  - [x] Configurazione globale
  - [x] Generazione channels.xml da database
  - [x] Grab EPG con comando reale (npm run grab)
  - [x] Serve guide.xml via API
  - [x] Parsing conteggio programmi
  - [x] Statistiche channels/programs
- [x] API endpoints `/api/epg/*` (12 endpoint completi)

#### 4.4 UI Integration ✅
- [x] Pagina `/epg` EPG Settings completa
- [x] Link navigazione in App.vue

#### 4.5 Integrazione Esterna EPG Grabber ✅
- [x] Setup directory `epg-grabber/` con clone iptv-org/epg
- [x] Test grab con sito reale (arirang.com - 342 programmi)
- [x] Integrazione comando grab reale in epgService
- [x] Export M3U con `url-tvg` header automatico

**Feature Opzionale Non Implementata**:
- [ ] Schedulazione automatica (node-cron) - può essere aggiunta in futuro

**Risultato**: Integrazione EPG completa e funzionante! 🎉

---

#### 4.5.1 Database Extension ✅
- [x] Migration 004_epg_mapping_tables.sql
- [x] Tabella `epg_source_channels` (canali disponibili per source)
- [x] Tabella `channel_epg_mappings` (mapping M3U → EPG)
- [x] Colonna `priority` in `epg_sources`
- [x] Indici per performance matching

#### 4.5.2 Backend Services ✅
- [x] `epgChannelsParser.js` - Parser .channels.xml da epg-grabber/sites/
  - [x] `parseChannelsXml()` - Parse singolo file XML
  - [x] `scanChannelsFiles()` - Scan directory sites/
  - [x] `loadChannelsForSource()` - Carica canali per source
  - [x] `syncAllSourceChannels()` - Sync completo da filesystem
  - [x] `searchChannelsByXmltvId()` - Ricerca per xmltv_id
  - [x] `getChannelsStats()` - Statistiche canali EPG
- [x] `epgMatchingService.js` - Matching intelligente
  - [x] `autoMatchAllChannels()` - Auto-match completo con opzioni
  - [x] `findExactMatch()` - Match esatto su xmltv_id con priorità
  - [x] `findFuzzyMatch()` - Match fuzzy su nome (Levenshtein)
  - [x] `createMapping()` - Crea/aggiorna mapping
  - [x] `getMappingForChannel()` - Recupera mapping singolo
  - [x] `getAllMappings()` - Tutti i mapping con dettagli
  - [x] `getAlternativeMatches()` - Alternative per manual override
  - [x] `deleteMapping()` - Rimuovi mapping
  - [x] `getMappingStats()` - Statistiche matching
- [x] `epgService.js` - Estensioni
  - [x] `generateCustomChannelsXml()` - Genera custom.channels.xml da mapping
  - [x] `grabCustomEpg()` - Grab EPG con custom channels

#### 4.5.3 API Routes ✅
- [x] `POST /api/epg/channels/sync` - Sync channels da filesystem
- [x] `GET /api/epg/channels/stats` - Statistiche canali EPG
- [x] `GET /api/epg/channels/source/:sourceId` - Canali per source
- [x] `POST /api/epg/matching/auto` - Run auto-matching
- [x] `GET /api/epg/matching/all` - Tutti i mapping
- [x] `GET /api/epg/matching/channel/:channelId` - Mapping singolo
- [x] `GET /api/epg/matching/alternatives/:tvgId` - Alternative per tvg-id
- [x] `POST /api/epg/matching/manual` - Manual override mapping
- [x] `DELETE /api/epg/matching/channel/:channelId` - Rimuovi mapping
- [x] `GET /api/epg/matching/stats` - Statistiche matching
- [x] `POST /api/epg/generate-custom-xml` - Genera custom XML
- [x] `POST /api/epg/grab-custom` - Grab con custom channels

#### 4.5.4 Frontend UI ✅
- [x] `EpgMatchingView.vue` - Pagina completa EPG Matching
  - [x] Stats cards (total, mapped, unmapped, manual)
  - [x] EPG channels stats display
  - [x] Actions bar (sync, auto-match, generate, grab)
  - [x] Mappings table con filtri
  - [x] Alternative sources modal
  - [x] Manual override workflow
  - [x] Visual indicators (match quality, colors)
- [x] Router integration (`/epg/matching`)
- [x] Navigation link in App.vue

#### 4.5.5 Documentazione ✅
- [x] `EPG_MATCHING_GUIDE.md` - Guida utente completa
  - [x] Workflow spiegato step-by-step
  - [x] Setup iniziale
  - [x] Auto-matching algorithm
  - [x] Manual override guide
  - [x] Troubleshooting
  - [x] API reference
  - [x] Database schema
  - [x] Best practices

**Risultato**: Sistema EPG Multi-Source completo e funzionante! 🎉🎉

**Miglioramenti Rispetto a Fase 4**:
- ⚡ Grab time ridotto fino al 93% (solo canali necessari)
- 📦 guide.xml size ridotto fino al 99% (15 KB vs 5 MB)
- 🎯 Precisione matching con priorità configurabile
- 🔧 Controllo manuale per casi edge
- 📊 Statistiche complete per monitoraggio

---

### Fase 5 - Ricerca e Filtri
**Status**: ❌ Non iniziata

#### 5.1 Backend
- [ ] Endpoint `/api/channels/search?q=query`
- [ ] Filtri per gruppo
- [ ] Filtri per stato (exported/hidden)
- [ ] Filtri per modifiche (overridden)

#### 5.2 Frontend
- [ ] Barra ricerca globale
- [ ] Filtri sidebar
- [ ] Risultati evidenziati
- [ ] Ricerca real-time (debounced)

---

### Fase 6 - Testing e QA
**Status**: ❌ Non iniziata

#### 6.1 Unit Tests
- [ ] Test parser M3U
- [ ] Test import service
- [ ] Test export service
- [ ] Coverage > 80%

#### 6.2 Integration Tests
- [ ] Test API endpoints
- [ ] Test database migrations
- [ ] Test Docker build

#### 6.3 E2E Tests
- [ ] Test import flow
- [ ] Test edit flow
- [ ] Test export flow

---

### Fase 7 - Documentazione
**Status**: ❌ Non iniziata

- [ ] API documentation (Swagger/OpenAPI)
- [ ] User guide (screenshots)
- [ ] Developer guide
- [ ] Deployment guide
- [ ] Troubleshooting

---

### Fase 8 - Produzione
**Status**: ❌ Non iniziata

#### 8.1 Security
- [ ] Valutare autenticazione (opzionale)
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] CORS configuration

#### 8.2 Performance
- [ ] Database indexing review
- [ ] Query optimization
- [ ] Frontend bundle size optimization
- [ ] Caching headers

#### 8.3 Monitoring
- [ ] Logging system
- [ ] Error tracking
- [ ] Health check endpoint

---

## 🎓 Decisioni Architetturali

### 1. Matching Canali: Solo `tvg_id`
**Decisione**: Il matching tra import successivi avviene SOLO tramite `tvg_id`

**Motivazione**: L'URL può cambiare tra import diversi

**Implicazioni**:
- Canali senza `tvg_id` riceveranno un ID generato
- Duplicati possibili se `tvg_id` manca

### 2. Storicità: Imported vs Custom Fields
**Decisione**: Separare valori importati da valori personalizzati

**Schema**:
```sql
imported_tvg_name TEXT,  -- Sempre aggiornato dall'import
custom_tvg_name TEXT,     -- Impostato dall'utente, preservato
is_name_overridden INTEGER -- Flag per sapere quale usare
```

**Benefici**:
- Tracciabilità completa
- Possibilità di reset
- Visibilità modifiche originali

### 3. Container Singolo
**Decisione**: Un solo container per backend + frontend

**Motivazione**: Semplicità deployment e gestione

**Trade-off**:
- ✅ Deploy semplice (`docker-compose up`)
- ✅ Meno risorse
- ❌ Meno scalabilità (ok per uso personale)

### 4. SQLite vs PostgreSQL
**Decisione**: SQLite per semplicità

**Motivazione**:
- File-based, nessun server DB separato
- Sufficiente per uso personale/domestico
- Backup = copia file

**Quando migrare a PostgreSQL**:
- Uso multi-utente
- Migliaia di canali
- Necessità concorrenza alta

### 5. Nessuna Autenticazione
**Decisione**: Nessuna autenticazione per MVP

**Motivazione**: Uso su rete locale/personale

**Quando aggiungere**:
- Esposizione su Internet
- Multi-utente

---

## 📝 Note Tecniche

### Import M3U - Parser Behavior
- Riconosce solo linee `#EXTINF:`
- Estrae attributi: `tvg-ID`, `tvg-name`, `tvg-logo`, `group-title`
- URL sulla riga successiva
- Tipo canale riconosciuto da URL:
  - `/series/` → serie TV (ESCLUSO per ora)
  - `/movie/` → film (ESCLUSO per ora)
  - Altro → TV (IMPORTATO)

### Export M3U - Generator Logic
```javascript
// Per ogni canale
const name = is_name_overridden ? custom_tvg_name : imported_tvg_name;
const logo = is_logo_overridden ? custom_tvg_logo : imported_tvg_logo;
const group = group_title.name; // Usa sempre nome gruppo corrente
```

### Database Migrations
- Auto-eseguite all'avvio del server
- Tracciamento in tabella `migrations`
- Idempotenti (safe per re-run)

### Volume Docker
- Path: `./data:/app/data`
- Contiene:
  - `database.sqlite` - Database persistente
  - `output/playlist.m3u` - File generati

---

## 🐛 Known Issues

### Bug #1: Checkbox Bulk Selection - Ultimo Elemento Non Si Aggiorna Visivamente
**Status**: 🔴 Open
**Priorità**: Media
**Fase**: 2.3 - Selezione Multipla

**Descrizione**:
Durante la selezione multipla in Bulk Edit Mode con Shift+Click, l'ultimo elemento del range non aggiorna visivamente lo stato della checkbox, anche se la selezione viene registrata correttamente nel sistema.

**Comportamento Attuale**:
- Click singolo: ✅ Funziona correttamente
- Shift+Click primo elemento: ✅ Funziona correttamente
- Shift+Click elementi intermedi: ✅ Funzionano correttamente
- Shift+Click ultimo elemento: ❌ Proprietà `selected` viene impostata ma checkbox non si flagga visivamente

**Comportamento Atteso**:
Tutte le checkbox nell'intervallo dovrebbero aggiornarsi visivamente quando si fa Shift+Click.

**Dettagli Tecnici**:
- Pattern usato: `:checked="channel.selected"` (stesso pattern delle export checkbox che funzionano)
- La proprietà `selected` viene inizializzata in `loadData()` per tutti i canali
- I log mostrano che `channel.selected = true` viene eseguito correttamente
- Vue non traccia correttamente l'aggiornamento dell'ultimo elemento quando modificato con `preventDefault()`

**Tentativi di Fix**:
1. ❌ Usato `reactive({})` invece di proprietà channel - stesso problema
2. ❌ Usato `Object.assign()` - stesso problema
3. ❌ Usato `nextTick()` - stesso problema
4. ❌ Inizializzato proprietà `selected` in `loadData()` - stesso problema
5. ❌ Rimosso `.prevent` modificatore - risolve singoli ma non shift-click

**Workaround Temporaneo**:
L'utente può cliccare normalmente senza Shift per selezionare l'ultimo elemento, oppure cliccare due volte sull'ultimo elemento dopo lo Shift+Click.

**Note**:
- Le checkbox export (blu) con Shift+Click funzionano perfettamente perché non usano `preventDefault()` e modificano direttamente l'array `channels`
- Il problema sembra essere legato all'interazione tra `preventDefault()` e la reattività di Vue 3 sulle proprietà aggiunte dinamicamente

**Piano di Fix**:
Quando verrà fixato questo bug, implementare anche la seguente miglioria UX:
- ⚠️ **Inibire completamente il drag & drop quando si è in Bulk Edit Mode**
  - Disabilitare `vuedraggable` quando bulk mode è attivo
  - Motivazione: evitare conflitti tra drag e selezione multipla
  - Risultato: UX più chiara e prevedibile (o selezioni o riordini, non entrambi)

---

### Bug #2: Nuovo Gruppo Creato Va in Fondo Invece che in Testa
**Status**: 🔴 Open
**Priorità**: Bassa
**Fase**: 2.1 - Modali Edit

**Descrizione**:
Quando si crea un nuovo gruppo, questo viene inserito alla fine della lista invece che in testa (prima posizione).

**Comportamento Attuale**:
- Creazione nuovo gruppo → aggiunto in fondo alla lista

**Comportamento Atteso**:
- Creazione nuovo gruppo → aggiunto in testa alla lista (posizione 0, `sort_order = 0`)
- Tutti gli altri gruppi devono scalare di 1 nella posizione

**Implementazione Suggerita**:
- Backend: Incrementare `sort_order` di tutti i gruppi esistenti prima di inserire il nuovo
- Frontend: Ricaricare la lista dopo creazione per mostrare il nuovo ordine
- Alternativa: Inserire con `sort_order = -1` e poi fare reindex di tutti i gruppi

**Impatto**: Basso - workaround disponibile (drag & drop per riposizionare)

---

### Bug #3: Canali Unassigned Non Visibili Dopo Cancellazione Gruppo
**Status**: ✅ Fixed (2025-10-17)
**Priorità**: Alta
**Fase**: 2.1 - Modali Edit

**Descrizione**:
Quando si cancella un gruppo contenente canali, l'alert box correttamente informa che i canali "will not be deleted, only unassigned from this group", ma questi canali non sono visibili da nessuna parte nell'interfaccia.

**Comportamento Attuale**:
- Backend: Canali settati con `custom_group_id = NULL` (corretto) - `groups.js:124`
- Frontend: Nessuna sezione per visualizzare canali senza gruppo assegnato
- Risultato: Canali "spariscono" dall'UI ma esistono ancora nel DB

**Comportamento Atteso**:
- Creare una sezione speciale "Unassigned Channels" o "No Group" nella vista Manage
- Mostrare canali con `custom_group_id = NULL` in questa sezione
- Permettere di riassegnarli a un gruppo esistente

**Implementazione Suggerita**:
1. Frontend (`ManageView.vue`):
   - Aggiungere sezione "Unassigned Channels" in alto/basso della lista
   - Filtrare canali con `custom_group_id === null`
   - Mostrare con stile distintivo (es: bordo rosso/arancione)
   - Permettere drag & drop verso altri gruppi O bulk move

2. Backend (`channels.js`):
   - Già funziona correttamente, nessuna modifica necessaria
   - Query `LEFT JOIN` permette già di recuperare canali unassigned

3. UX Alternativa:
   - Invece di "unassign", chiedere all'utente cosa fare:
     - Option A: Cancella anche i canali
     - Option B: Sposta in gruppo specifico
     - Option C: Lascia unassigned (e mostra in sezione dedicata)

**Impatto**: Alto - rischio perdita dati percepita (canali "spariscono")

**Soluzione Implementata**:

1. **Sezione "Unassigned Channels"** (`ManageView.vue`):
   - Nuova sezione con sfondo arancione in alto della lista gruppi
   - Mostra tutti i canali con `custom_group_id === null`
   - Supporta bulk edit mode e selezione multipla
   - Permette edit singolo canale per riassegnarlo
   - Collapsabile con toggle expand/collapse
   - Funzione helper: `getUnassignedChannels()`

2. **Modale Delete Options** (`ManageView.vue` + `GroupEditModal.vue`):
   - Quando cancelli gruppo con canali, mostra modale con 3 opzioni:
     - **Keep channels (unassign)**: Canali vanno in "Unassigned Channels"
     - **Move to another group**: Select dropdown per scegliere gruppo destinazione
     - **Delete channels permanently**: Cancella anche i canali (⚠️ azione irreversibile)
   - UX intuitiva con radio buttons e descrizioni chiare
   - Validazione: se scegli "Move" devi selezionare un gruppo

3. **File Modificati**:
   - `frontend/src/views/ManageView.vue`: Sezione unassigned + modale opzioni
   - `frontend/src/components/GroupEditModal.vue`: Emit evento `delete-with-channels`

**Note Tecniche**:
- Backend già corretto: `backend/src/routes/groups.js:124`
- Query channels già supporta NULL: `LEFT JOIN group_titles g ON c.custom_group_id = g.id`
- Frontend ora visualizza correttamente canali con `custom_group_id === null`

---

## 💡 Idee Future (Backlog)

- [ ] Supporto multi-lingua (i18n)
- [ ] Temi dark/light mode
- [ ] Import automatico schedulato (cron)
- [ ] Backup/restore database
- [ ] Esportazione in altri formati (JSON, XML)
- [ ] API REST pubblica (per altre app)
- [ ] Mobile app (React Native?)
- [ ] Statistiche utilizzo canali
- [ ] Preferiti/Watchlist
- [ ] Integrazione Jellyfin/Plex

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
# Run migrations manualmente
cd backend && npm run migrate

# Accedi al database
sqlite3 data/database.sqlite
```

### Test
```bash
# Import file di test
curl -X POST -F "file=@test-playlist.m3u" http://localhost:3000/api/import/upload

# Export
curl -X POST http://localhost:3000/api/export

# Download playlist
curl http://localhost:3000/output/playlist.m3u
```

---

## 🔄 Changelog

### [0.8.0] - 2025-10-20
**Major Release**: 🚀 **Movies Management v2 - Group-Title Support + Async Job Queue!**

**Added**:
- ✅ **Group-Title Categorization**: Film organizzati per categoria con UI collapsabile
  - Database: Colonna `group_title` in tabella `movies` (Migration 006)
  - Parser: Estrazione automatica group-title da M3U
  - UI: Raggruppamento dinamico con collapse/expand per categoria
  - Checkbox inline per toggle STRM per gruppo

- ✅ **Async Job Queue System**: Operazioni filesystem non bloccanti con progress tracking
  - Service: `jobQueue.js` - Job queue in-memory con lifecycle completo
  - Stati job: pending → running → completed/failed/cancelled
  - Progress tracking: processed, created, deleted, errors, percentage
  - Auto-cleanup: job vecchi rimossi dopo 1 ora
  - Batch processing: 50 file alla volta con delay 10ms tra batch
  - Cancellabile: utente può interrompere job in corso

- ✅ **Real-Time Progress Bar**: UI animata per operazioni async
  - Barra gradient (blu → viola) con percentuale live
  - Contatore "X / Y files" aggiornato ogni secondo
  - Polling automatico job status (1 secondo)
  - Pulsante "Cancel" per interrompere operazione
  - Toast notifications per completamento/errori

- ✅ **STRM Tracking Column**: Database tracking stato STRM files
  - Migration 007: Colonna `strm_enabled` (0/1)
  - Checkbox riflette stato persistente
  - Memoria dello stato tra sessioni

**Changed**:
- ✅ **FLAT Structure Enforced**: Struttura filesystem semplificata
  - **Before**: `/movies/{group_title}/{movie_name}/{movie_name}.strm`
  - **After**: `/movies/{movie_name}/{movie_name}.strm` (NO group-title in path!)
  - Motivazione: Semplicità e compatibilità con media servers

- ✅ **Toggle STRM Endpoint Redesign**: Da sincrono a asincrono
  - **Before**: `POST /api/movies/toggle-strm-group` → risponde dopo completamento (blocca minuti!)
  - **After**: Risponde immediatamente con `jobId`, processing in background
  - Performance: Server non si blocca più con migliaia di file

- ✅ **Movies List Loading Optimization**: Caricamento ultra-veloce
  - Stats caricata in **background** (non blocca UI)
  - Progress bar parte **immediatamente** con primo batch
  - Batch size: 1000 film per richiesta (era 100)
  - **Rimosso delay 50ms** tra batch (velocità max)
  - **Total count** da primo batch invece che da stats API

**Improved**:
- ✅ **Keep-Alive Router Caching**: Navigazione istantanea
  - Vue keep-alive su `<router-view>` (App.vue)
  - Movies → Manage → Movies = **0 secondi** (era 20-30 sec!)
  - Dati mantenuti in memoria, no ricaricamenti inutili

- ✅ **In-Memory State Updates**: Nessun reload dopo job completion
  - **Before**: `await loadData()` ricaricava TUTTI i 33k film dopo ogni job
  - **After**: `updateGroupStrmState()` aggiorna solo gruppo in-memory (istantaneo!)
  - Stats ricaricate in background (non bloccante)

- ✅ **Separated Import Endpoints**: Import dedicati per channels e movies
  - `POST /api/import/channels/upload` - Solo canali TV
  - `POST /api/import/channels/url` - Solo canali TV da URL
  - `POST /api/import/movies/upload` - Solo film
  - `POST /api/import/movies/url` - Solo film da URL
  - Frontend: Dual-tab interface (📺 TV Channels | 🎬 Movies)

**Fixed**:
- 🔥 **CRITICAL**: Bulk delete performance fix per cleanup orphaned movies
  - **Before**: 1973 film cancellati UNO per UNO = server freeze per minuti/ore
  - **After**: Singola query `DELETE WHERE tvg_name NOT IN (...)` = 0.3 secondi!
  - Impact: Import non blocca più il server con migliaia di cancellazioni

**Performance Metrics**:
- 📊 Caricamento 33k film: **20-30 secondi** → **5-10 secondi** (3-6x più veloce)
- 📊 Navigazione Movies ↔ Manage: **20-30 secondi** → **0 secondi** (keep-alive)
- 📊 Job completion reload: **~10 secondi** → **istantaneo** (in-memory update)
- 📊 Progress bar start: **15-20 secondi** → **<1 secondo** (stats in background)
- 📊 STRM creation throughput: **~37 file/secondo** (1761 in 47 sec)
- 📊 Cleanup orphaned movies: **minuti/ore** → **0.3 secondi** (1973 film)

**Backend Files**:
- `backend/src/services/jobQueue.js` (**nuovo** - 160 righe)
- `backend/src/db/migrations/006_movies_group_support.sql` (**nuovo**)
- `backend/src/db/migrations/007_movies_strm_tracking.sql` (**nuovo**)
- `backend/src/services/movieService.js` (refactored per FLAT structure + bulk delete)
- `backend/src/routes/movies.js` (3 nuovi endpoint: toggle-async, jobs/:id, jobs/:id DELETE)
- `backend/src/services/importService.js` (split importChannelsOnly/importMoviesOnly)
- `backend/src/routes/import.js` (4 endpoint separati channels/movies)

**Frontend Files**:
- `frontend/src/views/MoviesView.vue` (major refactor: progress bar, polling, collapse, optimizations)
- `frontend/src/views/ImportView.vue` (dual-tab interface)
- `frontend/src/App.vue` (keep-alive router-view)

**Breaking Changes**: Nessuno (backward compatible)

**Migration**: Automatica (006 e 007 eseguite al startup)

**Known Limitations**:
- Job queue in-memory: job persi se server restart (accettabile per use case)
- Polling frontend ogni 1 secondo (future: WebSocket per push real-time)
- Max 50 file per batch (configurabile nel codice se necessario)

---

### [0.7.1] - 2025-10-19
**Incremental Release**: 🔀 **Separated Import + Performance Critical Fix**

**Fixed**:
- 🔥 **CRITICAL PERFORMANCE FIX**: Movies cleanup bulk delete optimization
  - **Before**: Deleted orphaned movies one-by-one (10000+ queries = server freeze)
  - **After**: Single bulk DELETE query with NOT IN clause
  - **Performance**: 1973 movies deleted in **0.3s** instead of minutes/hours
  - **Impact**: Import no longer blocks server with thousands of deletions
  - File: `backend/src/services/movieService.js:191-224`

**Changed**:
- ✅ **Separated Import Flow**: Import ora diviso tra Channels e Movies
  - Frontend: Dual-tab interface (📺 TV Channels | 🎬 Movies)
  - Upload File e From URL disponibili per entrambi i tipi
  - Stats specifiche per tipo di contenuto
  - Clear automatico stato quando si cambia tab

**Added**:
- ✅ **New Backend Endpoints**:
  - `POST /api/import/channels/upload` - Upload M3U per canali TV
  - `POST /api/import/channels/url` - Import da URL per canali TV
  - `POST /api/import/movies/upload` - Upload M3U per film
  - `POST /api/import/movies/url` - Import da URL per film
- ✅ **New Import Functions**:
  - `importChannelsOnly(content)` - Importa solo canali da M3U
  - `importMoviesOnly(content)` - Importa solo film da M3U
  - Legacy `importM3U()` mantenuto per backward compatibility (deprecated)

**Improved**:
- ✅ **Better UX**: Utente controlla esattamente cosa importare
- ✅ **Clearer Stats**: Messaggi di successo specifici per tipo
  - Channels: "Total | New | Updated"
  - Movies: "Total | Created | Updated | Deleted"
- ✅ **State Management**: Watcher Vue per pulire stato al cambio tab

**Backend Files**:
- `backend/src/services/importService.js` - Refactored con 2 funzioni separate
- `backend/src/routes/import.js` - 4 nuovi endpoint + legacy deprecati

**Frontend Files**:
- `frontend/src/views/ImportView.vue` - Dual-tab interface con contentType state

**Breaking Changes**: Nessuno (backward compatible, legacy endpoints mantenuti)

**Migration**: Automatica (nessuna migration DB richiesta)

**Motivazione**:
- Evitare import accidentale di contenuti indesiderati
- Maggiore controllo per l'utente
- Preparazione per futura gestione Serie TV separata (Fase 3.2)

---

### [Unreleased]

**Planned**:
- Schedulazione automatica EPG grab (cron)
- Fuzzy matching migliorato con threshold configurabile
- Bulk actions per mapping

**Known Bugs**:
- 🐛 Bug #1: Checkbox bulk selection - ultimo elemento non aggiorna visivamente (workaround disponibile)
- 🐛 Bug #2: Nuovo gruppo creato va in fondo invece che in testa (workaround: drag & drop)

**Piccoli Bug Fix / Migliorie Future**:
- 🎨 Migliorare grafica bottoni EPG Matching (Sync EPG Sources, Run Auto-Matching, Grab EPG Data)
  - Considerare icons migliori, colori più distintivi, o layout differente
  - Da affrontare in una fase successiva

### [0.7.0] - 2025-10-19
**Major Release**: 🎬 **Movies Management System!**

**Added**:
- ✅ **Complete Movies Management**: Sistema completo gestione film con generazione automatica file .strm
  - Database: Tabella `movies` con tracking e cleanup automatico
  - Backend: `movieService.js` con sync, STRM creation/deletion, stats
  - API: 7 endpoint per gestione completa (`/api/movies/*`)
  - Frontend: `MoviesView.vue` con grid layout, search, stats cards
  - Parser: M3U parser esteso per riconoscere film (URL pattern `/movie/`)

- ✅ **STRM File Generation**: Generazione automatica struttura filesystem
  - Pattern: `/app/data/movies/{nome_film}/{nome_film}.strm`
  - File contiene solo URL stream
  - Sanitizzazione nomi per sicurezza filesystem
  - Auto-cleanup film obsoleti (non più nel feed)

- ✅ **Sync Logic**: Import intelligente con storicità
  - Matching tramite `tvg_name` (univoco)
  - Preserva film esistenti su re-import
  - Cancellazione automatica film obsoleti
  - Recovery file .strm mancanti

- ✅ **Movies UI**: Interfaccia completa gestione film
  - Stats: Totale film, STRM files count, directory path
  - Grid view con poster e metadata
  - Search bar real-time
  - Actions: View URL, Delete, Re-scan filesystem
  - Modal con copy to clipboard per URL

**Backend Files**:
- `backend/src/db/migrations/005_movies_support.sql` (nuovo)
- `backend/src/services/movieService.js` (nuovo, 365 righe)
- `backend/src/routes/movies.js` (nuovo, 195 righe)
- `backend/src/services/m3uParser.js` (modificato)
- `backend/src/services/importService.js` (modificato)
- `backend/src/server.js` (nuovo route)

**Frontend Files**:
- `frontend/src/views/MoviesView.vue` (nuovo, 370 righe)
- `frontend/src/main.js` (route `/movies`)
- `frontend/src/App.vue` (navigation menu)

**Test Files**:
- `test-movies.m3u` (4 film test)

**Test Results**:
- ✅ 4 movies imported successfully
- ✅ 4 folders + .strm files created
- ✅ Re-import preserves existing movies
- ✅ Cleanup removes obsolete movies
- ✅ API endpoints working correctly

**Breaking Changes**: Nessuno (backward compatible)

**Migration**: Automatica (005_movies_support.sql)

---

### [0.6.7] - 2025-10-19
**Incremental Release**: 🔧 **Settings Page Refactoring**

**Changed**:
- ✅ **EPG Settings → Settings**: Trasformata pagina in settings generale dell'applicazione
  - Rinominato `EpgView.vue` → `SettingsView.vue`
  - Aggiornato router: `/epg` → `/settings`
  - Riorganizzato menu navigazione: Import | Manage | Export | EPG Matching | Settings

**Added**:
- ✅ **EPG Sources Info Section**: Nuova sezione informativa con link diretto a GitHub
  - Link a https://github.com/iptv-org/epg/tree/master/sites
  - Spiegazione chiara su dove trovare le EPG sources disponibili
  - Riferimento alla pagina EPG Matching per il mapping

- ✅ **Output Streams Section**: Card dedicata con URL dei flussi di output
  - M3U Playlist URL: `http://localhost:3000/output/playlist.m3u`
  - EPG Guide XML URL: `http://localhost:3000/api/epg/xml`
  - Bottoni "Copy" per copiare URL negli appunti
  - Note informative su come usare gli URL da altri dispositivi

**Removed**:
- ❌ **Obsolete Grab Buttons**: Rimossi bottoni "Grab All Sources" e "Grab" singolo
  - Funzionalità ora gestita completamente dalla pagina EPG Matching
  - UI più pulita e meno confusionaria
  - Workflow centralizzato: EPG Matching è l'unico posto per grab EPG

- ❌ **Recent Grab Logs**: Rimossa sezione log dalla pagina settings
  - Informazione più pertinente alla pagina EPG Matching
  - Settings ora focalizzato su configurazione generale

**Improved**:
- ✅ **Toast Notifications**: Tutti gli alert() sostituiti con toast notifications
- ✅ **EPG Status Card**: Semplificata mostrando solo info essenziali
- ✅ **EPG Configuration**: Sezione mantenuta per grab_days e max_connections

**Files Modified**:
- `frontend/src/views/SettingsView.vue` (ex EpgView.vue)
- `frontend/src/main.js`: Updated router
- `frontend/src/App.vue`: Updated navigation menu

**Breaking Changes**: Nessuno (backward compatible, solo cambio URL `/epg` → `/settings`)

**Migration**: Automatica (browser redirect)

---

### [0.6.6] - 2025-10-19
**Incremental Release**: 🎨 **EPG UX Complete Overhaul**

**Fixed**:
- ✅ **Toast Position & Display**: Toasts now correctly positioned and centered top with proper stacking
  - Centralized toast container in `App.vue` (top-center with `left-1/2 transform -translate-x-1/2`)
  - Removed duplicate toast containers from individual views
  - Container with `space-y-2` for vertical spacing between multiple toasts
  - Multiple toasts don't overlap anymore
  - Toast width: `min-w-80 max-w-md` prevents text collapse
  - Text formatting: `flex-1 min-w-0 break-words` ensures proper wrapping
  - Better spacing with `gap-3` instead of manual margins

**Improved**:
- ✅ **Custom Confirm Dialogs**: Replaced browser confirm() with beautiful styled modals
  - Created `ConfirmDialog.vue` component with 3 variants (info, warning, danger)
  - Created `useConfirm` composable for Promise-based confirms
  - All confirms now have custom titles, messages, and button text
  - Smooth animations and backdrop blur
  - Consistent UX across all confirmation actions

**Removed**:
- ❌ **"Generate Custom XML" Button**: Redundant, now auto-executed before EPG grab
  - Backend already calls `generateCustomChannelsXml()` before grab (epgService.js:432)
  - Simplified workflow from 4 steps to 3: **Sync → Match → Grab**
  - Cleaner UI with fewer buttons
  - Better UX: users don't need to think about XML generation

**Files Created**:
- `frontend/src/components/ConfirmDialog.vue`: Custom confirm dialog component
- `frontend/src/composables/useConfirm.js`: Composable for managing confirm dialogs

**Files Modified**:
- `frontend/src/App.vue`:
  - Centralized toast container (top-center positioning)
- `frontend/src/views/EpgMatchingView.vue`:
  - Removed generateCustomXml() method and generating state
  - Replaced all confirm() and alert() calls with custom modals
  - Removed duplicate toast container
  - Removed ToastNotification import (handled by App.vue)
  - Integrated confirm dialogs
- `frontend/src/components/ToastNotification.vue`:
  - Improved width constraints (`min-w-80 max-w-md`)
  - Fixed text layout with `flex-1 min-w-0 break-words`
  - Better spacing with `gap-3`

**Breaking Changes**: None

**Migration**: None required (backward compatible)

### [0.6.5] - 2025-10-19
**Incremental Release**: 🎨 **EPG UX Improvements**

**Fixed**:
- ✅ **Channel Order in EPG Mapping**: Channels now correctly sorted by group sort_order and channel sort_order
  - Backend: Added `group_name`, `group_sort_order`, `sort_order` to getAllMappings() query
  - Frontend: Channels display in same order as Manage view

**Improved**:
- ✅ **Loading States**: All async operations show animated spinner icons
  - Sync EPG Sources: spinner + "Syncing EPG Sources..." text
  - Run Auto-Matching: spinner + "Running Auto-Matching..." text
  - Generate Custom XML: spinner + "Generating Custom XML..." text
  - Grab EPG Data: spinner + "Grabbing EPG Data..." text
- ✅ **Button Disable Logic**: All buttons disabled when ANY operation is running
  - Computed property `isAnyOperationRunning` prevents concurrent operations
  - Better visual feedback with `disabled:cursor-not-allowed` class
- ✅ **Toast Notifications**: Replaced all Windows alert() with toast notifications
  - Success toasts (green) for successful operations
  - Error toasts (red) for failures
  - Info messages show operation results (channels, sources, programs counted)
  - Duration: 3-5 seconds depending on importance
- ✅ **Safety Timeouts**: Prevent stuck operations
  - Sync: 5 minutes timeout
  - Auto-matching: 5 minutes timeout
  - Generate XML: 2 minutes timeout
  - Grab EPG: 10 minutes timeout (can take longer)
  - Toast error notification if timeout occurs

**Files Modified**:
- `backend/src/services/epgMatchingService.js`: Updated getAllMappings() query
- `frontend/src/views/EpgMatchingView.vue`: Complete UX overhaul (loading states, toasts, timeouts)

**Breaking Changes**: None

**Migration**: None required (backward compatible)

### [0.6.4] - 2025-10-18
**Incremental Release**: 🔧 **EPG Matching Enhancements**

**Added**:
- ✅ **Search Box in "Change EPG Source" Modal**: Ricerca real-time attraverso tutti i canali EPG
- ✅ **Remove Manual Mapping Button**: Opzione per rimuovere mapping manuale (solo per canali con is_manual = 1)
- ✅ **Manual Match Preservation**: I mapping manuali vengono preservati durante re-run auto-match

**Improved**:
- ✅ **Auto-Matching Performance**: Ottimizzato da N*M query a N query (~100x più veloce!)
  - Prima: ~6000-10000 query per 100 canali
  - Ora: 100 query per 100 canali
  - Tempo ridotto da ~30-60s a <1s
- ✅ **Case-Insensitive Matching**: Prioritario rispetto alle variations
- ✅ **Uppercase Variations**: Gestisce "La7" → "LA7.it"
- ✅ **Alternative Matches Intelligence**: Usa stesso algoritmo di findExactMatch con tutte le variations

**Fixed**:
- ✅ **M3U Plus Format Compliance**: tvg-ID → tvg-id, url-tvg → x-tvg-url
- ✅ **EPG Guide.xml HTTP Serving**: File EPG accessibile via /epg/guide.xml
- ✅ **Force tvg_id in guide.xml**: xmltv_id forzato a tvg_id del canale M3U
- ✅ **Search Results Priority Ordering**: Ordinamento automatico per priority

**Performance Metrics**:
- Auto-matching: ~100x più veloce
- Alternative matching: ~10-20x più risultati

---

### [0.6.0] - 2025-10-18
**Major Release**: 🚀 **EPG Multi-Source Matching System!**

**Added**:
- ✅ **EPG Multi-Source Matching**: Sistema intelligente mapping canali → EPG
  - Database: `epg_source_channels` + `channel_epg_mappings` tables
  - Migration 004_epg_mapping_tables.sql
  - Support per multiple EPG sources con priorità
- ✅ **Auto-Matching Intelligente**: Match automatico con exact + fuzzy fallback
  - Algoritmo Levenshtein distance per fuzzy matching
  - Priority system per conflitti multi-source
  - Stats completo: matched, unmapped, exact, fuzzy, manual
- ✅ **EPG Channels Parser**: Sync .channels.xml da epg-grabber/sites/
  - Parse XML con xml2js
  - Scan automatico directory sites/
  - Sync batch per tutte le sources attive
- ✅ **Custom Channels XML Generator**: Genera custom.channels.xml ottimizzato
  - Solo canali matched + exported
  - Multi-source support in singolo XML
  - Riduzione grab time fino al 93%
- ✅ **Grab EPG Ottimizzato**: Comando grab con custom channels
  - API `POST /api/epg/grab-custom`
  - Statistiche channels/programs/sources grabati
  - Logging completo in epg_grab_logs
- ✅ **EPG Matching UI**: Nuova pagina `/epg/matching`
  - Dashboard stats (total, mapped, unmapped, manual)
  - EPG channels stats (sources, channels by site)
  - Tabella mappings con filtri
  - Alternative sources modal per manual override
  - Actions: sync, auto-match, generate XML, grab
  - Visual indicators match quality (exact/fuzzy/manual)
- ✅ **API Endpoints**: 13 nuovi endpoint per matching system
  - Channels: sync, stats, source channels
  - Matching: auto, manual, alternatives, delete, stats
  - Grab: custom grab, generate XML

**Backend Files**:
- `backend/src/services/epgChannelsParser.js` (nuovo)
- `backend/src/services/epgMatchingService.js` (nuovo)
- `backend/src/services/epgService.js` (esteso)
- `backend/src/routes/epg.js` (13 nuovi endpoint)
- `backend/src/db/migrations/004_epg_mapping_tables.sql` (nuovo)
- `backend/package.json` (+xml2js dependency)

**Frontend Files**:
- `frontend/src/views/EpgMatchingView.vue` (nuovo, 450+ righe)
- `frontend/src/main.js` (nuova route)
- `frontend/src/App.vue` (navigation link)

**Documentation**:
- `EPG_MATCHING_GUIDE.md` (guida completa utente, 600+ righe)
- `ROADMAP.md` (Fase 4.5 documentata)

**Breaking Changes**: Nessuno (backward compatible con Fase 4)

**Migration**: Automatica (004_epg_mapping_tables.sql)

**Performance Improvements**:
- Grab time: ridotto 93% (esempio: 2 min vs 30 min)
- guide.xml size: ridotto 99% (esempio: 15 KB vs 5 MB)
- Network bandwidth: ridotto ~95%

**Known Limitations**:
- Fuzzy matching threshold fisso (0.8) - configurabile in futuro
- Nessuna schedulazione automatica matching (manuale per ora)

---

### [0.5.0] - 2025-10-18
**Major Release**: 🎉 **Integrazione EPG Completa!**

**Added**:
- ✅ **EPG Grabber Reale**: Installato e integrato `iptv-org/epg`
  - Clone repository in `epg-grabber/` directory
  - 884 packages installati
  - Supporto per centinaia di siti EPG
- ✅ **Grab Funzionante**: Comando grab reale integrato in `epgService.js`
  - Esecuzione `npm run grab` automatica da API
  - Parsing conteggio programmi da output
  - Statistiche channels/programs nei log
  - Test successful: 342 programmi grabati da arirang.com in 2m 41s
- ✅ **Export M3U con EPG**: Header `url-tvg` automatico
  - Aggiunto in `exportService.js`
  - Attivato solo se `guide.xml` esiste
  - URL: `http://localhost:3000/api/epg/xml`
- ✅ **Documentazione EPG**: File `EPG_SETUP.md` con guida completa

**Improved**:
- `epgService.js`: Sostituito placeholder con grab reale
- `exportService.js`: Ora async con check EPG data
- Error handling migliorato per epg-grabber mancante

**Files Created/Modified**:
- `epg-grabber/` directory con iptv-org/epg (1774 files)
- `epg-grabber/test-channels.xml` (test file)
- `epg-grabber/test-guide.xml` (342 programmi reali)
- `EPG_SETUP.md` (guida setup completa)
- `backend/src/services/epgService.js` (grab reale)
- `backend/src/services/exportService.js` (url-tvg header)

**Breaking Changes**: Nessuno

**Migration**: Nessuna (backward compatible)

**Known Limitations**:
- Schedulazione automatica EPG non implementata (opzionale per futuro)
- epg-grabber deve essere installato manualmente (vedi EPG_SETUP.md)

---

### [0.4.0-beta] - 2025-10-17
**Major Feature**: Integrazione EPG Base (Superata da v0.5.0)

**Note**: Versione beta con placeholder grab. Completata in v0.5.0 con grab reale.

### [0.3.0] - 2025-10-17
**Major Change**: Gruppo Speciale "Unassigned Channels"
- ✅ **Refactoring architetturale**: Sostituito `custom_group_id = NULL` con gruppo speciale "Unassigned Channels"
  - Nuovo gruppo con ID fisso: `00000000-0000-0000-0000-000000000000`
  - Colonna `is_special` aggiunta a `group_titles` per identificare gruppi speciali
  - Migration automatica: canali NULL migrati al gruppo Unassigned
  - Gruppo sempre presente, non eliminabile, non esportabile
  - Trattato come gruppo normale nell'UI ma con stile distintivo (arancione)

**Fixed**:
- ✅ **Bug #3**: Canali unassigned completamente reworkato
  - Rimossa sezione separata "Unassigned Channels"
  - Ora è un gruppo normale con comportamento speciale
  - Sfondo arancione, icona warning, non drag & drop, no edit button
  - Backend previene eliminazione gruppo Unassigned
- ✅ **Bulk Edit per Unassigned**: Funziona come tutti gli altri gruppi
- ✅ **Select Dropdown**: Fix selezione gruppo nel modale delete options
- ✅ **Drag & Drop Canali**: Fix ordinamento canali dentro gruppo
- ✅ **Group Creation Errors**: Fix INSERT query con colonne `is_exported` e `is_special` mancanti
- ✅ **Duplicate Group Names**: Validazione backend + messaggio errore user-friendly

**Improved**:
- Architettura più pulita e coerente (niente NULL)
- UX semplificata: Unassigned è un gruppo come gli altri
- Supporto completo bulk edit anche per canali unassigned
- Drag & drop canali ora persiste correttamente l'ordine
- Error handling migliorato con messaggi specifici dal backend

### [0.2.2] - 2025-10-17
**Fixed**:
- ✅ **Bug #3 (v1)**: Prima implementazione con sezione separata (poi reworkato in v0.3.0)

### [0.2.1] - 2025-10-17
**Added**:
- **Bulk Edit Mode toggle button** (attiva/disattiva modalità selezione)
- **Shift-Click per selezione range contigui**
- Bulk move canali tra gruppi con modale
- Checkbox condizionali (visibili solo in bulk mode)
- Counter selezioni nel gruppo header
- Tooltip informativi sui checkbox

**Fixed**:
- ✅ Checkbox toggle non ricarica più la pagina (aggiornamento locale)
- ✅ Rimosso drag cross-group confusionario
- ✅ Interfaccia più pulita con bulk mode separato

**Improved**:
- UX selezione multipla molto migliorata
- Interfaccia pulita quando non serve bulk edit
- Selezioni automatiche con Shift-Click

### [0.2.0] - 2025-10-17
**Added**:
- Modali edit complete per gruppi e canali
- Drag & Drop riordinamento gruppi
- Drag & Drop riordinamento canali
- Sistema toast notifications
- Visual indicator (★) per canali personalizzati
- Preview logo nei modali
- Reset customizzazioni ai valori originali
- Conferme per azioni distruttive

**Components**:
- `ChannelEditModal.vue`
- `GroupEditModal.vue`
- `ToastNotification.vue`
- `useToast.js` composable

**Improved**:
- ManageView con vuedraggable integration
- UX completa per gestione gruppi e canali

### [0.1.0] - 2025-10-17
**Added**:
- Setup iniziale progetto
- Database schema con storicità
- Import M3U (upload + URL)
- Export M3U con custom values
- UI base (Import/Manage/Export)
- Docker container funzionante
- Test completi import/export/storicità

---

**Ultimo Aggiornamento**: 2025-10-20 12:30
**Versione Corrente**: v0.8.0
**Prossimo Milestone**: Fase 3.2 - Gestione Serie TV (o Fase 5 - Ricerca e Filtri)

---

## 📝 Note di Rilascio v0.3.0

### Refactoring Architetturale: Gruppo Speciale "Unassigned Channels"

**Motivazione del Cambio**:
- Gestire `custom_group_id = NULL` era fonte di bug e complessità
- Logica frammentata tra "gruppo normale" e "nessun gruppo"
- UI aveva sezione separata diversa dai gruppi normali

**Nuova Implementazione**:
1. **Gruppo speciale permanente**: `00000000-0000-0000-0000-000000000000`
2. **Database**: Nuova colonna `is_special` per identificare gruppi con comportamento speciale
3. **Migration automatica**: Tutti i canali con `custom_group_id = NULL` migrati a gruppo Unassigned
4. **UI unificata**: Trattato come gruppo normale con stile distintivo

**Comportamento Gruppo Unassigned**:
- ✅ Visibile nella lista gruppi normali (sempre in fondo)
- ✅ Sfondo arancione + icona warning per distinguerlo
- ✅ NON drag & drop (posizione fissa)
- ✅ NON edit button (non modificabile/eliminabile)
- ✅ NON esportabile (checkbox export nascosta)
- ✅ Supporto completo bulk edit per spostare canali ad altri gruppi

**Vantaggi**:
- 🎯 Codice più pulito: niente gestione NULL
- 🎯 UI coerente: tutto è un gruppo
- 🎯 Meno bug: logica unificata
- 🎯 Più flessibile: facile aggiungere altri gruppi speciali in futuro

**Bug Fix Post-Release**:
- 🔧 Fixed errore 500 durante creazione nuovo gruppo (colonne `is_exported` e `is_special` mancanti)
- 🔧 Aggiunta validazione nome gruppo duplicato con messaggio user-friendly

---

## 📝 Note di Rilascio v0.2.2 (Superata da v0.3.0)

### Fix Critico: Canali Unassigned Ora Visibili (Prima Versione)

**Problema Risolto**: Bug #3 - Canali "sparivano" dopo cancellazione gruppo
- **Prima**: Canali con `custom_group_id = NULL` non visibili nell'UI
- **Ora**: Nuova sezione "⚠️ Unassigned Channels" mostra tutti i canali senza gruppo

**Nuova Feature 1**: Sezione Unassigned Channels
- Sfondo arancione distintivo per alta visibilità
- Collapsabile con toggle
- Supporta bulk edit e selezione multipla
- Ogni canale editabile per riassegnazione

**Nuova Feature 2**: Modale Smart Delete per Gruppi
Quando cancelli un gruppo con canali, scegli cosa fare:
1. **Keep channels (unassign)** - Default sicuro, canali vanno in sezione unassigned
2. **Move to another group** - Dropdown per selezionare destinazione
3. **Delete permanently** - Cancella gruppo E canali (⚠️ irreversibile)

**Impatto UX**:
- ✅ Nessun canale "sparisce" più
- ✅ Controllo completo su cancellazione gruppi
- ✅ Workflow più intuitivo e sicuro

---

## 📝 Note di Rilascio v0.2.1

### Miglioramenti Basati su Feedback Utente

**Problema 1**: Checkbox toggle ricaricava tutta la pagina
- **Soluzione**: Aggiornamento stato locale senza reload
- **Risultato**: Interfaccia fluida, nessun ritorno a inizio pagina

**Problema 2**: Drag cross-group confuso
- **Soluzione**: Rimosso e sostituito con Bulk Edit Mode dedicato
- **Risultato**: Interfaccia più intuitiva e prevedibile

**Nuova Feature**: Bulk Edit Mode con Shift-Click
- Toggle dedicato per attivare/disattivare modalità bulk
- Shift-Click per selezione rapida di range contigui
- Interfaccia pulita quando non serve bulk edit
