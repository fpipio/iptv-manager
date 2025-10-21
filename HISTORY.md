# 📜 IPTV Manager - Development History & Changelog

> Questo file contiene lo storico dettagliato dello sviluppo, changelog completo e note di rilascio.
> Per informazioni sullo stato attuale e roadmap futura, vedi [ROADMAP.md](ROADMAP.md)

---

## 🔄 Changelog

### [0.8.7] - 2025-10-21
**UX Improvement**: 🎨 **Reset Buttons Contestuali per Tab**

**Problema Identificato**:
La pagina Import ha 2 tab separati (📺 TV Channels | 🎬 Movies), ma la "Danger Zone" mostrava TUTTI i pulsanti di reset sempre, indipendentemente dal tab attivo. Confusionario!

**Soluzione Implementata**:
✅ **Reset buttons contestuali** - mostrati in base al tab attivo:

**Nel tab "📺 TV Channels"** (contentType === 'channels'):
- Reset Channels Only
- Reset Groups Only
- Reset EPG Mappings Only
- --- separatore ---
- Reset Everything

**Nel tab "🎬 Movies"** (contentType === 'movies'):
- Reset Movies Only
- --- separatore ---
- Reset Everything

**Benefici UX**:
- ✅ Meno confusione - vedi solo i reset rilevanti per il tab corrente
- ✅ UI più pulita - meno pulsanti visualizzati contemporaneamente
- ✅ Meno errori - non puoi accidentalmente cliccare il pulsante sbagliato
- ✅ Coerenza - import e reset separati per tipo (channels vs movies)

**Frontend** (`frontend/src/views/ImportView.vue`):
- Usato `v-if="contentType === 'channels'"` per pulsanti channels/groups/EPG
- Usato `v-if="contentType === 'movies'"` per pulsante movies
- Aggiunto divisore visivo prima di "Reset Everything"
- "Reset Everything" sempre visibile in entrambi i tab (separato da separatore)

**Files Rimossi**:
- `fix-movies-directory.ps1` - Script di debug v0.8.4 non più necessario
- `fix-movies-directory.sh` - Script di debug v0.8.4 non più necessario

**Testing**:
1. Vai a http://localhost:3000 → Import
2. Nel tab "📺 TV Channels" → vedi 3 reset (channels, groups, EPG) + Reset Everything
3. Switcha al tab "🎬 Movies" → vedi solo 1 reset (movies) + Reset Everything
4. I pulsanti cambiano dinamicamente quando cambi tab ✅

**Impact**: UX molto migliorata - reset ora contestuale al tipo di contenuto che stai gestendo

**Breaking Changes**: None (only improves existing functionality)

---

### [0.8.6] - 2025-10-21
**Feature Release**: ✨ **Reset Granulare con "Reset Movies Only"**

**Problema Risolto**:
L'utente aveva ragione: perché avere script esterni quando esistono già pulsanti nella UI?

**Soluzione Implementata - Reset Granulare**:
Aggiunto pulsante **"Reset Movies Only"** nella pagina Import, seguendo lo stesso pattern degli altri pulsanti esistenti:

1. ✅ **Reset Channels Only** (già esistente)
2. ✅ **Reset Groups Only** (già esistente)
3. ✅ **Reset EPG Mappings Only** (già esistente)
4. ✅ **Reset Movies Only** (NUOVO!)
5. ✅ **Reset Everything** (già esistente, ora aggiornato)

**Backend** (`backend/src/routes/movies.js`):
- Aggiunto endpoint `POST /api/movies/reset/all`
- Cancella tutti i movies dal database
- Cancella tutti i file STRM dal filesystem
- Response con contatori movies/STRM files eliminati

**Frontend** (`frontend/src/views/ImportView.vue`):
- Aggiunto pulsante arancione "Reset Movies Only"
- Funzione `resetMovies()` con conferma utente
- Posizionato logicamente tra "Reset EPG Mappings" e "Reset Everything"

**Cosa Cancella "Reset Movies Only"**:
- ✅ Tutti i movies dal database
- ✅ Tutti i file .strm e cartelle da disco
- ⚠️ **NON tocca**: Channels, Groups, EPG Mappings

**Cosa Cancella "Reset Everything"** (aggiornato):
- ✅ Tutti i channels
- ✅ Tutti i groups (tranne Unassigned)
- ✅ Tutti i movies (NUOVO!)
- ✅ Tutti i file STRM (NUOVO!)
- ✅ Tutti gli EPG mappings

**Files Modificati**:
- `backend/src/routes/movies.js` - Nuovo endpoint `/reset/all`
- `backend/src/routes/reset.js` - Fix column names (`value` non `config_value`)
- `frontend/src/views/ImportView.vue` - Nuovo pulsante + funzione

**Files Rimossi** (soluzioni errate):
- `reset-database.ps1` - Script esterno non necessario
- `reset-database.sh` - Script esterno non necessario
- `DATABASE_MANAGEMENT.md` - Documentazione basata su soluzione sbagliata

**Chiarimento: Database Persistence**:
Quando installi l'applicazione su un server nuovo e trovi dati già popolati:
- ❌ **NON è** perché il database viene incluso nell'immagine Docker
- ✅ **È perché** usi un volume Docker (`./data:/app/data`) che persiste tra container
- ✅ **Soluzione**: Cancella la directory `./data/` sul server prima del primo deploy

Il `.dockerignore` esclude correttamente `data/` dal build, quindi l'immagine Docker è sempre pulita. I dati persistono solo se la directory `data/` esiste già sul filesystem host.

**Testing**:
```bash
# Import test movies
curl -X POST -F "file=@test-movies.m3u" http://localhost:3000/api/import/movies/upload
# Result: 10 movies imported

# Reset movies only
curl -X POST http://localhost:3000/api/movies/reset/all
# Result: 10 movies deleted, 0 STRM folders (no STRM were generated)

# Verify
sqlite3 data/database.sqlite "SELECT COUNT(*) FROM movies;"
# Result: 0 ✅
```

**Impact**: UX molto migliorata - reset ora granulare e intuitivo, tutto dalla UI senza script esterni

**Breaking Changes**: None (only adds functionality)

---

### [0.8.5] - 2025-10-20
**Bug Fix Release**: 🐛 **"Reset Everything" Button Now Actually Resets Everything**

**Problem Fixed**:
- ✅ **"Reset Everything" button in UI did NOT delete movies** (despite the name!)
  - Only deleted channels, groups, and EPG mappings
  - Left 33,393 movies in database and STRM files on disk
  - User confusion: "I clicked Reset Everything but still see data!"

**Root Cause**:
- Backend endpoint `/api/reset/all` was incomplete
- Missing `DELETE FROM movies` statement
- Missing filesystem cleanup for STRM files
- Frontend confirm dialog did not mention movies

**Solution Implemented**:
- ✅ **Backend Fix** (`backend/src/routes/reset.js`):
  - Added `DELETE FROM movies` (clears all movies from database)
  - Added filesystem cleanup (deletes all STRM folders and files)
  - Enhanced response message with detailed counts
  - Safe error handling: filesystem errors don't fail entire reset

- ✅ **Frontend Fix** (`frontend/src/views/ImportView.vue`):
  - Updated confirm dialog: now mentions "All movies" and "All STRM files"
  - Updated button description: "Delete ALL: channels, groups, movies, STRM files, and EPG mappings"

**What Gets Deleted Now**:
1. ✅ All channels
2. ✅ All groups (except special "Unassigned" group)
3. ✅ All movies (NEW!)
4. ✅ All STRM files and folders (NEW!)
5. ✅ All EPG mappings

**What Gets Kept**:
- ✅ Unassigned group (special group)
- ✅ EPG sources (configuration)
- ✅ EPG source channels (available EPG pool)
- ✅ EPG config (settings)

**Testing**:
Before fix:
```bash
# After "Reset Everything" button
Channels: 2789 (should be 0!)
Movies: 33393 (should be 0!)
```

After fix:
```bash
# After "Reset Everything" button
Channels: 0 ✅
Movies: 0 ✅
STRM files: All deleted ✅
```

**Files Modified**:
- `backend/src/routes/reset.js` - Added movies + STRM deletion
- `frontend/src/views/ImportView.vue` - Updated UI text

**Impact**: Critical UX bug resolved - "Reset Everything" now lives up to its name!

**Breaking Changes**: None (only adds missing functionality)

**Related**:
- See Bug #4 in Known Issues for database persistence behavior
- See `DATABASE_MANAGEMENT.md` for reset scripts and best practices

---

### [0.8.4] - 2025-10-20
**Bug Fix Release**: 🐛 **Movies Directory Configuration Persistence Fix**

**Problem Fixed**:
- ✅ **Movies Directory not persisting after page refresh on remote server**
  - Configuration saved correctly via API and persisted in database
  - Backend working perfectly (verified with curl commands)
  - Frontend displayed old/default value after refresh due to timing issue

**Root Cause**:
- Frontend Vue.js component initialized with **hardcoded default value** in `data()`
- Async config loading from server happened AFTER initial render
- Hardcoded value (`/app/data/movies`) overrode loaded value from database

**Solution Implemented**:
- ✅ **Frontend Initialization Fix** (`frontend/src/views/MoviesView.vue:461`):
  - Changed default from hardcoded path to empty string: `outputDirectory: ''`
  - Created new `loadConfig()` method to load configuration BEFORE other data
  - Made `mounted()` async and call `await loadConfig()` first
  - Removed config loading from `loadStats()` to avoid duplication
- ✅ **Database Migration 008** (`backend/src/db/migrations/008_add_movies_directory_config.sql`):
  - Ensured `movies_directory` config key exists in `epg_config` table
  - Added default value `/app/data/movies` if not present
- ✅ **Enhanced Logging** (backend/src/services/movieService.js):
  - Added comprehensive logging to `getMoviesDirectory()` and `setMoviesDirectory()`
  - Added write verification after database saves
  - Console output shows exact values being saved and loaded
- ✅ **Docker Debugging Tools** (Dockerfile):
  - Added `sqlite3` CLI to container for database debugging
  - Created `debug-db.js` Node.js script as alternative debugging tool

**Deployment Documentation**:
- ✅ **DEPLOYMENT.md**: Comprehensive deployment guide with troubleshooting
  - Explains volume separation strategy (database on local disk, movies on NFS)
  - Step-by-step server setup instructions
  - Health check scripts and verification commands
- ✅ **QUICKSTART.md**: 2-minute quick start guide for rapid deployment
- ✅ **docker-compose.prod.yml**: Production-ready configuration template
  - Separated volumes for database (local) and movies (NFS share)
  - Environment variables configuration
  - Port mapping and network setup

**Files Modified**:
- `frontend/src/views/MoviesView.vue` - Critical timing fix
- `backend/src/services/movieService.js` - Enhanced logging + verification
- `backend/src/db/migrations/008_add_movies_directory_config.sql` (new)
- `Dockerfile` - Added sqlite3 package
- `backend/src/db/debug-db.js` (new)

**Files Created**:
- `DEPLOYMENT.md` - Full deployment documentation (350+ lines)
- `QUICKSTART.md` - Quick start guide (88 lines)
- `docker-compose.prod.yml` - Production configuration template
- `docker-compose-production.yml` - Alternative production config

**Version History**:
- v0.8.2: Initial fix attempt with migration 008 and logging
- v0.8.3: Frontend rebuild with `--no-cache` to ensure changes included
- v0.8.4: Final fix with Vue.js initialization timing correction ✅

**Testing**:
- ✅ Tested on localhost: Working correctly
- ✅ Tested on remote server (192.168.88.11:3010): Working correctly
- ✅ Configuration persists after page refresh
- ✅ Database writes verified with sqlite3 and curl commands
- ✅ Frontend console logs show correct loading sequence

**Impact**: Critical bug resolved - Movies Directory configuration now persists correctly on all environments

**Breaking Changes**: None (backward compatible)

**Migration**: Automatic (migration 008 runs on container startup)

---

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

**Ultimo Aggiornamento**: 2025-10-21 03:30
**Versione Corrente**: v0.8.9
**Prossimo Milestone**: Fase 3.2 - Gestione Serie TV (o Fase 5 - Ricerca e Filtri)

---

## 📝 Note di Rilascio v0.8.9

### Gestione Avanzata Duplicati tvg-ID + Bug Fixes Critici

**Data Rilascio**: 2025-10-21

**Problema Principale Risolto**:
L'utente ha segnalato un bug critico dove canali con tvg-ID duplicato nello stesso file M3U venivano silenziosamente sovrascritti, mantenendo solo l'ultimo. Esempio: tre canali diversi con `tvg-id="Rai1.it"` → solo l'ultimo veniva importato.

**Soluzione Implementata - Sistema Dual-Strategy**:

**1. Duplicati DENTRO lo stesso file**:
- ✅ **SEMPRE auto-rinominati** (es: `Rai1.it` → `Rai1.it-2` → `Rai1.it-3`)
- ✅ Nessuna perdita di dati - tutti i canali vengono importati
- ✅ Avviso giallo pre-import con conteggio duplicati

**2. Duplicati con database esistente**:
- ✅ **Utente sceglie la strategia** via modal pre-import:
  - **Replace**: Aggiorna canali esistenti con nuovi dati
  - **Keep All (Auto-rename)**: Mantiene entrambi rinominando i nuovi
  - **Skip**: Mantiene solo i canali esistenti, ignora nuovi duplicati
- ✅ Avviso arancione pre-import con lista dettagliata

**Componenti Implementati**:

**Backend**:
- **Migration 009** (`009_add_original_tvg_id.sql`):
  - Aggiunta colonna `original_tvg_id` a tabella `channels`
  - Indice per lookup veloce
  - Tracking permanente di canali rinominati

- **importService.js** (refactoring completo):
  ```javascript
  // Tracking duplicati con Set per evitare collisioni
  const processedTvgIds = new Set()

  // Array dettagliato canali rinominati
  const renamedChannelsList = []

  // Logica dual-strategy
  if (processedTvgIds.has(tvgId)) {
    // Duplicato in-file → auto-rename
  } else if (existingInDb) {
    // Duplicato DB → applica strategia utente
  }
  ```

- **Nuovi Endpoint API**:
  - `POST /api/import/channels/analyze` - Pre-import analysis (file upload)
  - `POST /api/import/channels/analyze-url` - Pre-import analysis (URL)
  - Parametro `duplicateStrategy` aggiunto a tutti gli endpoint import

**Frontend**:
- **DuplicateStrategyModal.vue** (nuovo componente):
  - Summary con conteggio totale canali
  - Box giallo per duplicati in-file (info only)
  - Box arancione per duplicati DB (richiede scelta)
  - Radio buttons per selezione strategia
  - Stati: nessun duplicato (verde), duplicati trovati (warning)

- **ImportView.vue** (workflow modificato):
  ```javascript
  // Nuovo flusso: Analyze → Modal → Import
  1. Upload/URL selection
  2. Pre-import analysis
  3. Show modal con strategia
  4. Import con strategia selezionata
  5. Toast con report dettagliato canali rinominati
  ```

  - Report post-import con lista scrollabile:
    ```
    ⚠️ Duplicate tvg-id Renamed:
    • Sky Cinema 1: Rai1.it → Rai1.it-2 (duplicate in file)
    • Sky Sport 1: sport.it → sport.it-3 (duplicate with database)
    ```

- **ManageView.vue** (indicatori visivi):
  - Icona arancione ↻ accanto al nome (tooltip con original tvg-id)
  - Testo esplicativo: `ID: Rai1.it-2 (renamed from: Rai1.it)`
  - Stile coerente con stella blu ★ per canali personalizzati

**Bug Fixes Aggiuntivi**:

**1. Auto-refresh mancante dopo navigazione**:
- **Problema**: ManageView e EPG Matching mostravano dati vuoti dopo import fino a refresh manuale
- **Causa**: Cache keep-alive di Vue Router non ricaricava dati
- **Fix**:
  - ManageView.vue: Aggiunto hook `onActivated()` (Composition API)
  - EpgMatchingView.vue: Aggiunto hook `activated()` (Options API)
  - Reload automatico quando componente si riattiva da cache

**2. Errore "Cannot GET /epg/matching" su refresh pagina**:
- **Problema**: Path statico `/epg` in conflitto con route SPA `/epg/matching`
- **Causa**: Express serviva file statici EPG su `/epg/*`, mascherando route Vue
- **Fix**:
  - server.js: Static files spostati da `/epg` a `/epg-files`
  - exportService.js: Aggiornato riferimento path in XML
  - SPA fallback escluso da `/epg-files/*`

**3. Import button disabilitato dopo reset**:
- **Problema**: Dopo "Reset All" e ri-selezione dello stesso file, bottone Import rimaneva grigio
- **Causa**: Browser non triggera evento `change` se file è identico a precedente
- **Fix**:
  ```javascript
  const clearFileInput = () => {
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = '' // Reset DOM input
    }
  }
  ```
  - Chiamato dopo import, cambio tab, e rimozione file

**Database Schema Update**:
```sql
-- Migration 009
ALTER TABLE channels ADD COLUMN original_tvg_id TEXT;
CREATE INDEX idx_channels_original_tvg_id ON channels(original_tvg_id);
```

**API Response Changes**:
```javascript
// Import response ora include:
{
  success: true,
  stats: {
    total: 150,
    new: 100,
    updated: 45,
    renamed: 5,
    renamedList: [
      {
        name: "Sky Cinema 1",
        originalTvgId: "Rai1.it",
        newTvgId: "Rai1.it-2",
        reason: "duplicate_in_file"
      },
      // ...
    ],
    strategy: "replace"
  }
}
```

**Impatto UX**:
- ✅ **Zero perdita dati** - tutti i canali duplicati vengono preservati
- ✅ **Trasparenza totale** - utente sa esattamente cosa succede
- ✅ **Controllo granulare** - scelta strategia per duplicati DB
- ✅ **Tracking permanente** - sempre visibile quali canali sono stati rinominati
- ✅ **Auto-refresh intelligente** - navigazione fluida senza refresh manuali
- ✅ **No conflitti routing** - EPG matching e SPA coesistono

**Testing**:
- ✅ Import file con duplicati interni: tutti i canali preservati e rinominati
- ✅ Import file con duplicati DB: modal mostra scelte, strategia applicata
- ✅ ManageView: icona ↻ visibile, tooltip funzionante
- ✅ Post-import toast: lista dettagliata rinominazioni
- ✅ Database: `original_tvg_id` popolato correttamente
- ✅ Navigazione: auto-refresh funzionante su ManageView e EPG Matching
- ✅ EPG routing: `/epg/matching` accessibile anche dopo refresh
- ✅ File re-import: bottone Import sempre attivo dopo reset

**Files Modificati**:
- `backend/src/db/migrations/009_add_original_tvg_id.sql` (nuovo)
- `backend/src/services/importService.js` (refactoring completo)
- `backend/src/routes/import.js` (nuovi endpoint analyze)
- `backend/src/server.js` (fix routing EPG)
- `backend/src/services/exportService.js` (path update)
- `frontend/src/components/DuplicateStrategyModal.vue` (nuovo)
- `frontend/src/views/ImportView.vue` (workflow completo)
- `frontend/src/views/ManageView.vue` (indicatori + auto-refresh)
- `frontend/src/views/EpgMatchingView.vue` (auto-refresh)

**Lezioni Apprese**:
1. **Silent data loss è inaccettabile** - duplicati devono sempre generare warning/action
2. **Pre-flight checks salvano tempo** - analisi prima di import previene sorprese
3. **Transparency builds trust** - mostrare dettagli operazioni aumenta confidenza utente
4. **Keep-alive needs activation hooks** - cache Vue richiede gestione esplicita lifecycle
5. **Static paths vs SPA routes** - separazione netta evita conflitti (es: `/epg` vs `/epg-files`)

---

## 📝 Note di Rilascio v0.8.8

### Completa Separazione Domini: TV vs Movies Reset

**Problema Risolto**:
L'utente ha richiesto una separazione netta tra la gestione dei dati TV (channels, groups, EPG) e i dati Movies, in linea con la dual-tab interface della pagina Import.

**Filosofia di Design**:
- 🎯 **Tab TV Channels**: Gestisce SOLO dati TV (canali, gruppi, EPG mappings)
- 🎯 **Tab Movies**: Gestisce SOLO dati Movies (film, file .strm)
- 🎯 **Nessun incrocio**: Reset TV non tocca Movies, Reset Movies non tocca TV

**Cambiamenti Implementati**:

**1. Backend - Nuovo Endpoint** (`backend/src/routes/reset.js`):
```javascript
POST /api/reset/tv-all
```
- Elimina: channels, groups (tranne Unassigned), EPG mappings
- NON tocca: movies, STRM files
- Risposta esplicita: "Movies were not affected"

**2. Frontend - Reset Contestuali** (`frontend/src/views/ImportView.vue`):

**Tab TV Channels** mostra:
- Reset Channels Only (arancione)
- Reset Groups Only (arancione)
- Reset EPG Mappings Only (giallo)
- **Reset All TV Data** (rosso scuro, con doppia conferma)

**Tab Movies** mostra:
- **Reset All Movies** (arancione) - elimina film + STRM files

**3. Rimosso**:
- ❌ Button "Reset Everything" globale che toccava entrambi i domini
- ❌ Script esterni di debug (`fix-movies-directory.ps1`, `fix-movies-directory.sh`)
- ❌ Documentazione obsoleta (`DATABASE_MANAGEMENT.md`)

**4. Messaggi di Conferma Espliciti**:
- "Reset All TV Data": "⚠️ Delete ALL TV data: channels, groups, and EPG mappings (movies NOT affected)"
- "Reset All Movies": "Delete all movies and STRM files (TV channels NOT affected)"

**Versioni Intermedie**:
- **v0.8.5**: Enhanced "Reset Everything" per includere movies
- **v0.8.6**: Aggiunto "Reset Movies Only" button
- **v0.8.7**: Reset contestuali basati su tab attivo
- **v0.8.8**: Completa separazione domini - NESSUN reset che attraversa TV/Movies ✅

**Impatto UX**:
- ✅ Separazione chiara e intuitiva
- ✅ Nessun rischio di cancellare dati non voluti
- ✅ UI pulita e contestuale
- ✅ Tutto gestibile dalla UI, nessun comando esterno necessario

**Lezione Appresa**:
L'architettura UI deve rispecchiare l'architettura dei dati. Se hai due tab separati (TV | Movies), i reset devono essere completamente separati, senza pulsanti globali che attraversano i domini.

---

## 📝 Note di Rilascio v0.8.4

### Bug Fix Critico: Movies Directory Configuration Persistence

**Problema Identificato**:
La configurazione della Movies Directory (STRM Output Directory) non persisteva dopo un page refresh quando l'applicazione veniva eseguita su un server remoto. Il problema non si manifestava su localhost.

**Analisi Dettagliata**:

Il bug è stato particolarmente insidioso perché il backend funzionava perfettamente:
- ✅ API `/api/movies/config` salvava correttamente nel database
- ✅ Database SQLite persisteva i dati (verificato con sqlite3)
- ✅ Successive letture restituivano il valore corretto (verificato con curl)

Il problema era **esclusivamente frontend**: Vue.js inizializzava il componente con un valore hardcoded che sovrascriveva il valore caricato in modo asincrono dal server.

**Root Cause - Timing Issue Vue.js**:
```javascript
// PRIMA (PROBLEMATICO):
data() {
  return {
    outputDirectory: '/app/data/movies',  // ❌ Hardcoded default
    // ...
  }
}

async mounted() {
  this.loadData();  // Carica film
}

async loadStats() {
  // Config caricata DOPO che l'UI è già renderizzata
  const configRes = await axios.get('/api/movies/config');
  this.outputDirectory = configRes.data.data.movies_directory;  // Troppo tardi!
}
```

**Sequenza eventi problematica**:
1. Vue.js inizializza `outputDirectory = '/app/data/movies'` (hardcoded)
2. UI renderizza con valore hardcoded
3. `mounted()` parte in background
4. Config viene caricata asincronicamente
5. Valore viene aggiornato MA troppo tardi, e a volte non triggera re-render

**Soluzione Implementata**:
```javascript
// DOPO (CORRETTO):
data() {
  return {
    outputDirectory: '',  // ✅ Nessun default, sarà caricato dal server
    // ...
  }
}

async mounted() {
  // Config caricata PRIMA di tutto
  await this.loadConfig();  // BLOCKING - aspetta completamento
  // Solo DOPO carica i film
  this.loadData();
}

async loadConfig() {
  const configRes = await axios.get('/api/movies/config');
  if (configRes.data.success) {
    this.outputDirectory = configRes.data.data.movies_directory;
  }
  // ...
}
```

**Componenti della Soluzione**:

1. **Frontend Fix** (frontend/src/views/MoviesView.vue):
   - Rimosso valore hardcoded da `data()`
   - Creato metodo `loadConfig()` dedicato
   - `mounted()` ora è async e chiama `await loadConfig()` PRIMA di tutto
   - Config garantita caricata prima del rendering

2. **Database Migration 008**:
   - Assicura esistenza della chiave `movies_directory` in `epg_config`
   - Fornisce valore default se mancante
   - Idempotente e safe per re-run

3. **Enhanced Logging**:
   - Backend logga ogni lettura/scrittura del valore
   - Write verification dopo ogni save
   - Console output aiuta debugging

4. **Docker Debugging Tools**:
   - `sqlite3` CLI aggiunto al container
   - Script Node.js `debug-db.js` per query database
   - Permette verifica manuale dello stato del database

**Deployment Documentation**:
Per facilitare il deployment su server remoti sono stati creati:
- **DEPLOYMENT.md**: Guida completa con troubleshooting e best practices
- **QUICKSTART.md**: Setup rapido in 2 minuti
- **docker-compose.prod.yml**: Template production-ready con volume separation

**Volume Separation Strategy**:
```yaml
volumes:
  - ./data:/app/data              # Database su disco LOCALE (performance + stabilità)
  - /media/movies:/app/movies     # Movies su NFS share (solo file .strm)
```

Separazione critica: SQLite su NFS può causare corruzione dati. Database deve stare su disco locale.

**Testing Completo**:
- ✅ Localhost (Windows): Config persiste correttamente
- ✅ Remote server (Linux 192.168.88.11:3010): Config persiste correttamente
- ✅ Verificato con curl che backend salva/carica correttamente
- ✅ Verificato con sqlite3 che database persiste correttamente
- ✅ Console logs mostrano sequenza corretta di caricamento

**Versioni Intermedie**:
- **v0.8.2**: Prima implementazione con migration 008 + logging (problema persisteva)
- **v0.8.3**: Rebuild frontend con `--no-cache` per escludere cache Docker (problema persisteva)
- **v0.8.4**: Fix definitivo del timing Vue.js ✅ (problema risolto!)

**Lezione Appresa**:
Quando un problema si manifesta solo in production e non su localhost, spesso non è un problema di backend/database ma di **timing e stato iniziale del frontend**. In questo caso, il valore hardcoded mascherava il problema su localhost perché coincideva con il default desiderato.

**Impatto**: Bug critico risolto - configurazione ora persistente su tutti gli ambienti

---

## 📝 Note di Rilascio v0.9.0

### Fix Critico: EPG Grab Funzionante su Server Remoto

**Data Rilascio**: 2025-10-21
**Tipo**: Bug Fix Critico + Production Deployment

**Problema Risolto**: Bug #7 - EPG grab completava ma file guide.xml non disponibile

#### Sintomi
- ✅ Grab EPG completava con successo (46 canali, 1684 programmi)
- ❌ API `/api/epg/xml` restituiva "No EPG data available"
- ❌ File `guide.xml` vuoto o non creato
- ✅ Su localhost funzionava perfettamente
- ❌ Su server remoto (production) non funzionava

#### Root Causes
1. **EPG Grabber mancante dall'immagine Docker**
   - Directory `epg-grabber/` con 505 sorgenti EPG non copiata nel Dockerfile
   - Su localhost funzionava grazie al volume mount
   - In production l'immagine Docker non conteneva i file necessari

2. **Frontend con URL hardcoded**
   - Tutti gli URL API erano `http://localhost:3000/api/...`
   - UI su `http://192.168.88.11:3010` faceva chiamate a localhost
   - Causava CORS e chiamate al server sbagliato

3. **Mancanza di diagnostica**
   - Nessuna verifica se `guide.xml` veniva creato
   - Errori silenziosi durante grab

#### Soluzioni Implementate

**1. Dockerfile Enhancement**
```dockerfile
# Copy EPG grabber (critical for EPG functionality)
COPY epg-grabber/ ./epg-grabber/

# Install EPG grabber dependencies
WORKDIR /app/epg-grabber
RUN npm install --omit=dev

# Create data directory
RUN mkdir -p /app/data/output /app/data/epg
```

**2. .dockerignore Update**
```
epg-grabber/node_modules    # Evita symlink problems
epg-grabber/guides          # Temporary files
epg-grabber/*.xml           # Generated files
```

**3. EPG Service - File Verification**
Aggiunto controllo post-grab in `epgService.js`:
```javascript
// VERIFY FILE WAS CREATED
console.log(`[EPG] Verifying output file exists: ${outputPath}`);
try {
  const stats = await fs.stat(outputPath);
  console.log(`[EPG] ✅ File created successfully! Size: ${stats.size} bytes`);
} catch (error) {
  console.error(`[EPG] ❌ ERROR: Output file NOT found`);
  throw new Error(`EPG grab completed but output file not created`);
}
```

**4. Frontend - Relative URLs**
Sostituiti tutti gli URL hardcoded:
- `http://localhost:3000/api/` → `/api/`
- `http://localhost:3000/output/` → `/output/`

File modificati:
- `frontend/src/views/EpgMatchingView.vue` (13 occorrenze)
- `frontend/src/views/SettingsView.vue` (10 occorrenze)

#### Risultati Test

**Localhost (Windows)**:
- ✅ EPG grab: 881 KB guide.xml
- ✅ 46 canali matchati, 1684 programmi
- ✅ API `/api/epg/xml` restituisce dati corretti

**Server Remoto (Linux 192.168.88.11:3010)**:
- ✅ EPG grab: 882 KB guide.xml
- ✅ 46 canali matchati, 1689 programmi
- ✅ API `/api/epg/xml` restituisce dati corretti
- ✅ UI "Grab EPG" button funzionante

#### File Modificati
- `Dockerfile` - Include epg-grabber nell'immagine
- `.dockerignore` - Esclude file temporanei epg-grabber
- `backend/src/services/epgService.js` - Verifica file (2 metodi)
- `frontend/src/views/EpgMatchingView.vue` - URL relativi
- `frontend/src/views/SettingsView.vue` - URL relativi

#### Deploy Instructions

Sul server remoto:
```bash
# Pull nuova immagine
docker pull fpipio/iptv-manager:latest

# Restart container
docker-compose down && docker-compose up -d

# Verify EPG grab works
curl http://localhost:3010/api/epg/xml | head -20
```

#### Benefici
- 🎯 EPG funzionante in production
- 🎯 URL relativi rendono app portabile (qualsiasi host/porta)
- 🎯 Logging dettagliato per troubleshooting
- 🎯 Immagine Docker self-contained (no volume mount necessari)

**Impatto**: Bug critico risolto - EPG ora production-ready! 🎉

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
