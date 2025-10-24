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

**Ultimo Aggiornamento**: 2025-10-24

**Versione Corrente**: v0.9.9-dev

**Fase Corrente**: ✅ **Fase 5 (Parziale)** + **Frontend Refactoring** - Ricerca Canali + Import Asincrono + **Movie Cleanup System** + **Multi-Library Year Organization** + **Emby Integration** + **Subtitle Backup System** (✅ Testato e Funzionante) + **NFS Cache Fix** + **Tab-Based Navigation** Implementati

**Prossima Fase**: Fase 9 (Mobile Responsive Design) o Fase 3.2 (Serie TV)

### Funzionalità Operative
- ✅ **🎨 Tab-Based Navigation UI** (architettura frontend refactored: 3 aree principali - Channels, Movies, Settings - con tabs interno per feature grouping)
- ✅ **Import M3U asincrono con progress bar** (file upload + URL, dual-tab TV|Movies, batch processing 500 items)
- ✅ Gestione completa canali TV (CRUD, drag & drop, bulk edit, selezione multipla)
- ✅ Gestione gruppi (CRUD, riordinamento, gruppo speciale "Unassigned")
- ✅ **Ricerca canali real-time** (search bar con filtro su nome, tvg-id, logo URL)
- ✅ **Gestione film con generazione .strm files** (job queue asincrono, progress tracking)
- ✅ **🧹 Movie Cleanup System** (rimozione automatica nomi attori, 89 pattern predefiniti, preview bulk, tracking storico)
- ✅ **📅 Multi-Library Year Organization** (organizzazione film per periodi anno in sottocartelle, toggle enable/disable, statistiche distribuzione)
- ✅ **🎬 Emby Integration** (toggle enable/disable, refresh globale tutte le librerie, configurazione in Settings, sezione condizionale in Movies)
- ✅ **💾 Subtitle Backup System** (backup/restore automatico file .srt durante cancellazione/ripristino film, ripristino parziale supportato)
- ✅ **🔧 NFS Cache Fix** (fsync file + directory per compatibilità NFS mount, 4 endpoint diagnostici per troubleshooting)
- ✅ **EPG Multi-Source Matching System** (auto-matching, custom XML, grab ottimizzato)
- ✅ **Gestione duplicati tvg-ID avanzata** (pre-import analysis, modal strategia, tracking permanente)
- ✅ **Export M3U con preview e download** (generazione M3U, preview contenuto, download diretto)
- ✅ **Danger Zone centralizzata** (reset granulare TV/Movies in Settings > Advanced tab)
- ✅ Container Docker con production deployment funzionante
- ✅ Keep-alive routing per navigazione istantanea

### Funzionalità Mancanti
- ❌ Gestione Serie TV
- ❌ Filtri avanzati (per gruppo, stato, modifiche)
- ❌ Schedulazione automatica EPG
- ❌ Mobile PWA (Progressive Web App)

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

### **Fase 5.4** - Subtitle Backup System (100% ✅ TESTATO) 🆕
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
  - `restoreSubtitles(movieDir)` - Ripristina file `.srt` dal backup dopo creazione (usa `copyFile`, non `rename`)
- **Integrazione**:
  - `deleteStrmFile()` - Backup automatico prima di `fs.rm()`
  - `createStrmFile()` - Restore automatico dopo `fs.writeFile()`
  - `syncFilesystemFromDb()` - Backup/restore durante sync massivo
- **Persistenza Backup** (⚠️ IMPORTANTE):
  - **I backup sono PERMANENTI** e non vengono cancellati dopo il ripristino
  - Usa `copyFile()` invece di `rename()` → backup rimane disponibile per futuri usi
  - Puoi cancellare e ripristinare lo stesso film infinite volte senza perdere sottotitoli
  - Funge da **cache permanente** e backup di sicurezza
  - Pulizia manuale opzionale se `.subtitles_backup/` diventa troppo grande (~200MB per 1000 film)
- **Ripristino parziale**:
  - Cancello 1000 film → 1000 backup creati
  - Ripristino 300 film → 300 sottotitoli ripristinati
  - **Tutti i 1000 backup rimangono disponibili** (anche quelli già ripristinati)
- **Caratteristiche**:
  - ✅ Preserva sottotitoli durante cancellazione/ripristino film
  - ✅ Backup permanente (zero perdita dati anche con ripristini multipli)
  - ✅ Funziona con ripristini parziali
  - ✅ Non sovrascrive sottotitoli esistenti (safe)
  - ✅ Compatibile con Year Libraries e struttura FLAT
  - ✅ Logging dettagliato per debug
  - ✅ Silenzioso quando non ci sono backup (nessun errore)
  - ✅ Nessuna migration database richiesta (backward compatible)
- **Testing** (2025-10-24): ✅ Sistema testato e funzionante, backup e restore operano correttamente
- **Documentazione**: Vedi [SUBTITLE_BACKUP.md](SUBTITLE_BACKUP.md) per dettagli completi e FAQ

### **Fase 5.5** - Frontend UI Refactoring (100%) 🆕
- **🎨 Refactoring completo architettura frontend** da navigazione flat a tab-based navigation
- **Problema risolto**: Navigazione con 6 link piatti (Import, Manage, Movies, Export, Settings, EPG Matching) era confusa e difficile da scalare
- **Soluzione**: Architettura feature-based con 3 aree principali + tabs interni

#### **Architettura Prima vs Dopo**
**❌ PRIMA** (Flat Navigation - 6 link):
```
Import | Manage | Movies | Export | Settings | EPG Matching
```

**✅ DOPO** (Feature-Based - 3 aree):
```
📺 Channels          🎬 Movies           ⚙️ Settings
├─ Import            ├─ Import           ├─ General
├─ Manage            ├─ Library          ├─ EPG
└─ EPG Matching      ├─ Cleanup          └─ Advanced (Danger Zone)
                     └─ Year Organization
```

#### **Modifiche Implementate**
1. **Channels Area** (`ChannelsView.vue`):
   - 3 tabs: Import, Manage, EPG Matching
   - Componenti estratti: `ChannelsImportTab.vue`, `ChannelsManageTab.vue`, `ChannelsEpgMatchingTab.vue`
   - Import M3U dual-tab (TV/Movies) con gestione duplicati tvg-id

2. **Movies Area** (`MoviesView.vue`):
   - 4 tabs: Import, Library, Cleanup, Year Organization
   - Tab Import: Import M3U dedicato per film
   - Tab Library: Gestione libreria + STRM Output Directory + Emby Integration condizionale
   - Tab Cleanup: Sistema pulizia nomi attori (già esistente)
   - Tab Year Organization: Organizzazione multi-library per anno (già esistente)

3. **Settings Area** (`SettingsView.vue`):
   - 3 tabs: General, EPG, Advanced
   - **General Tab**:
     - Output Streams (M3U playlist URL, EPG XML URL)
     - Export M3U Playlist (generazione, preview, download)
     - Integrations (Emby toggle + configurazione)
   - **EPG Tab**:
     - EPG Sources management
     - EPG Configuration (grab days, connections)
     - EPG Status monitoring
   - **Advanced Tab**:
     - Danger Zone (reset TV channels, groups, EPG, movies, everything)

4. **Database Migration 014**:
   - Aggiunto campo `emby_enabled` in `epg_config` per persistenza toggle Emby
   - Default: enabled se `emby_server_url` già configurato, disabled altrimenti

5. **Backend API Updates**:
   - `GET/PUT /api/movies/emby-config`: Supporto campo `emby_enabled`
   - Toggle salva immediatamente stato in database

6. **Frontend Event System**:
   - CustomEvent `emby-config-updated` per sincronizzazione Settings → Movies
   - Sezione Emby in Movies > Library visibile solo se `emby_enabled === true`

#### **Component Organization**
```
components/
├── channels/
│   ├── ChannelsImportTab.vue
│   ├── ChannelsManageTab.vue
│   └── ChannelsEpgMatchingTab.vue
├── movies/
│   ├── MoviesImportTab.vue
│   ├── CleanupTab.vue
│   └── YearLibrariesTab.vue
└── shared/
    ├── ChannelEditModal.vue
    ├── GroupEditModal.vue
    ├── DuplicateStrategyModal.vue
    ├── ConfirmDialog.vue
    └── ToastNotification.vue
```

#### **Router & Legacy Redirects**
- **Nuove rotte**:
  - `/channels` → ChannelsView (default: import tab)
  - `/movies` → MoviesView (default: import tab)
  - `/settings` → SettingsView (default: general tab)

- **Legacy redirects** (backward compatibility):
  - `/import` → `/channels`
  - `/manage` → `/channels`
  - `/epg/matching` → `/channels`
  - `/export` → `/settings`

#### **Benefici**
- ✅ **Scalabilità**: Pronto per Serie TV (stesso pattern tabs)
- ✅ **UX migliorata**: Navigazione intuitiva con 3 aree principali
- ✅ **Consistenza**: Tutte le view usano pattern tabs
- ✅ **Manutenibilità**: Componenti organizzati per feature
- ✅ **Backward compatible**: Legacy URLs reindirizzano automaticamente
- ✅ **Separation of concerns**: Channels, Movies, Settings separati

#### **Bug Fix**
- ✅ Toggle Emby non persisteva stato (risolto con migration 014)
- ✅ `addToast` undefined error in catch block (risolto con null checks)
- ✅ Sezione Emby visibile anche quando disabilitata (risolto con computed `isEmbyConfigured`)

#### **Docker Deployment**
- ✅ Frontend compilato e deployato su porta 3000
- ✅ Docker image pushato su Docker Hub: `fpipio/iptv-manager:latest`
- ✅ Migration 014 applicata automaticamente all'avvio

#### **Documentazione**
- Vedi [REFACTORING_COMPLETE.md](REFACTORING_COMPLETE.md) per dettagli completi
- File structure dettagliata, test checklist, metriche LOC

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

### Fase 9 - Mobile Responsive Design
**Status**: ❌ Non iniziata | **Priorità**: Alta

**Obiettivo**: Rendere l'interfaccia web esistente perfettamente usabile su dispositivi mobile (smartphone e tablet) tramite responsive design

**Decisione Architetturale**: NO PWA, solo **Responsive Web App**

**Motivazione**:
- ✅ **Uso saltuario**: L'app è usata per configurazione/gestione, non quotidianamente
- ✅ **Bookmark sufficiente**: Gli utenti possono salvare `http://IP:3000` nei preferiti
- ✅ **Zero complessità**: No service worker, no manifest, no cache offline
- ✅ **Self-hosted**: Richiede sempre connessione al backend Docker (offline inutile)
- ✅ **Multi-device naturale**: Stessa URL accessibile da PC, tablet, smartphone
- ✅ **Update immediati**: Refresh = ultima versione, no cache PWA

**PWA Rejected** perché:
- ❌ Offline mode inutile (serve backend sempre online)
- ❌ Install prompt confonde utenti
- ❌ Icona home screen non aggiunge valore
- ❌ Notifiche push non necessarie
- ❌ Overhead tecnico non giustificato

---

#### 9.1 Responsive Layout Audit (2 giorni)
- [ ] **Breakpoints Analysis**
  - Verificare tutti i componenti su mobile (320px-480px)
  - Verificare layout smartphone large (480px-640px)
  - Verificare layout tablet portrait (640px-768px)
  - Verificare layout tablet landscape (768px-1024px)
  - Testare transizioni tra breakpoints

- [ ] **Component Fixes**
  - Tabelle: scrollabili orizzontalmente su mobile con swipe
  - Modali: adattare a schermo piccolo (padding ridotto, bottom sheet opzionale)
  - Dropdown: espandere a full-width su mobile
  - Forms: input full-width, font-size minimo 16px (evita zoom iOS)
  - Cards: stack verticale invece di grid su mobile
  - Navigation: hamburger menu collapsabile

- [ ] **Typography & Spacing**
  - Font-size leggibile su mobile (min 14px body, 16px input)
  - Line-height aumentato per leggibilità touch
  - Padding/margin ridotti ma touch-friendly
  - Headings scalabili con `clamp()` o breakpoints

#### 9.2 Touch Optimization (1 giorno)
- [ ] **Touch Targets**
  - Pulsanti: minimo 44x44px (Apple HIG) / 48x48px (Material Design)
  - Checkbox/radio: aumentare area cliccabile
  - Link: padding generoso per tap accuracy
  - Icon buttons: aumentare dimensione su mobile

- [ ] **Touch Interactions**
  - Verificare drag & drop su touch devices (Channels/Groups reorder)
  - Testare bulk selection con tap (no Shift+Click su mobile)
  - Swipe orizzontale per tabelle scrollabili
  - Long-press per azioni secondarie (opzionale)

- [ ] **Mobile-Specific UX**
  - Sticky headers per tabelle lunghe
  - Scroll-to-top button su liste lunghe
  - Loading spinners visibili su azioni asincrone
  - Toast notifications ottimizzate (bottom position su mobile)

#### 9.3 Navigation & Layout (1 giorno)
- [ ] **Responsive Navigation**
  - Hamburger menu per navigazione principale su mobile
  - Tab navigation orizzontale scrollabile (se overflow)
  - Breadcrumb collassato su mobile (icona home + current page)
  - Bottom navigation bar (opzionale, per accesso rapido)

- [ ] **Adaptive Layouts**
  - Sidebar collassabile o convertita in drawer mobile
  - Grid → Stack layout su mobile (channels, movies)
  - Split view → Full page su mobile
  - Fixed header/footer per massimizzare content area

- [ ] **Viewport & Meta Tags**
  - Verificare `<meta name="viewport">` corretto
  - Prevent zoom su input focus (font-size >= 16px)
  - Safe area insets per notch/home indicator (iOS)

#### 9.4 Testing & Validation (mezza giornata)
- [ ] **Device Testing**
  - Test iOS Safari (iPhone SE, iPhone 14, iPad)
  - Test Chrome Android (various screen sizes)
  - Test landscape/portrait rotation
  - Verificare scroll performance (no lag)

- [ ] **Browser DevTools**
  - Chrome Device Mode: testare tutti i preset
  - Firefox Responsive Design Mode
  - Safari Responsive Design Mode
  - Lighthouse mobile audit (score > 90)

- [ ] **Real Device Testing**
  - Test su almeno 2 dispositivi fisici (iOS + Android)
  - Verificare touch gestures fluidi
  - Check performance su rete mobile (4G/5G)

---

#### Tech Stack
- **CSS Framework**: TailwindCSS (già in uso, excellent responsive utilities)
- **Responsive Strategy**: Mobile-first breakpoints
- **Testing Tools**: Chrome DevTools, Lighthouse, BrowserStack (opzionale)
- **No Dependencies**: Zero librerie aggiuntive necessarie

#### Effort Estimate
- **Responsive Layout Audit**: 2 giorni
- **Touch Optimization**: 1 giorno
- **Navigation & Layout**: 1 giorno
- **Testing & Validation**: 0.5 giorni
- **TOTALE**: **4-5 giorni**

#### Deliverables
- ✅ UI completamente responsive (320px-1024px+)
- ✅ Touch-friendly (tap targets 44x44px+)
- ✅ Performance mobile ottimizzata
- ✅ Testato su iOS Safari + Chrome Android
- ✅ Zero overhead PWA
- ✅ Backward compatible (no breaking changes)

#### Future Considerations
Se in futuro servisse PWA (improbabile):
- Service Worker può essere aggiunto in 1-2 giorni
- Manifest.json in 1 ora
- Ma per ora: **YAGNI** (You Aren't Gonna Need It)

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

### 7. Mobile: Responsive Web Only (NO PWA)
**Decisione**: Implementare **solo responsive design**, NO Progressive Web App

**Motivazione**:
- ✅ **Self-hosted app**: Richiede sempre backend Docker attivo (offline inutile)
- ✅ **Uso saltuario**: Configurazione/gestione, non app quotidiana
- ✅ **Bookmark sufficiente**: `http://IP:3000` salvato nei preferiti è sufficiente
- ✅ **Zero overhead**: No service worker, no manifest, no cache management
- ✅ **Update istantanei**: Browser refresh = ultima versione (no PWA cache)
- ✅ **Semplicità**: Responsive CSS è 10x più semplice di PWA setup

**PWA Rejected perché**:
- ❌ Offline mode inutile (serve connessione al backend sempre)
- ❌ Install prompt confonde utenti (non è WhatsApp/Instagram)
- ❌ Notifiche push non necessarie
- ❌ Icona home screen non aggiunge valore per uso saltuario
- ❌ Complessità non giustificata (service worker, caching strategy, update logic)

**Approccio**:
- TailwindCSS responsive utilities (già in uso)
- Mobile-first breakpoints (320px-1024px+)
- Touch-friendly UI (44x44px tap targets)
- Testing su iOS Safari + Chrome Android
- Effort: 4-5 giorni vs 5-10 giorni PWA

**Future Path** (se necessario):
- Responsive web è foundazione per qualsiasi soluzione futura
- Se serve PWA → Aggiungibile in 1-2 giorni (service worker + manifest)
- Se serve app nativa → Capacitor (wrappa Vue.js esistente)
- Ma per ora: **YAGNI** (You Aren't Gonna Need It)

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
- [ ] Multi-user support con autenticazione
- [ ] Streaming proxy (per canali con IP whitelist)
- [ ] Player IPTV integrato nella web app

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
# Deploy produzione standard
docker-compose -f docker-compose.production.yml up -d

# Deploy con porta custom
PORT=3010 docker-compose -f docker-compose.production.yml up -d

# Per NFS share: decommenta volume /media/movies in docker-compose.production.yml
```

Vedi [DEPLOYMENT.md](DEPLOYMENT.md) e [QUICKSTART.md](QUICKSTART.md) per dettagli deployment completo.

---

## 📚 Riferimenti

- 📜 [HISTORY.md](HISTORY.md) - Changelog dettagliato e note di rilascio
- 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) - Guida deployment produzione
- ⚡ [QUICKSTART.md](QUICKSTART.md) - Quickstart guide
- 📖 [EPG_MATCHING_GUIDE.md](EPG_MATCHING_GUIDE.md) - Guida EPG matching system
- 💾 [SUBTITLE_BACKUP.md](SUBTITLE_BACKUP.md) - Sistema backup/restore sottotitoli

---

**Ultimo aggiornamento**: 2025-10-24 (v0.9.9-dev - Decisione Architetturale: NO PWA, Solo Responsive Web Design)
**Prossima revisione**: Dopo completamento Fase 9 (Mobile Responsive Design) o Fase 3.2 (Serie TV)
