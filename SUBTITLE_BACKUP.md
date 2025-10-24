# 🎬 Subtitle Backup System

## Overview

Il sistema di backup automatico dei sottotitoli preserva i file `.srt` scaricati da Emby quando i file `.strm` vengono cancellati e ripristinati.

## Problema risolto

**Scenario problematico**:
1. Hai 1000 film con file `.strm` generati
2. Emby scarica i sottotitoli e li salva nelle cartelle dei film (`.srt`)
3. Deseleziono una categoria di film → IPTV Manager cancella le cartelle con i file `.strm`
4. **I sottotitoli `.srt` vengono persi insieme alle cartelle**
5. Ripristino la categoria → devo scaricare nuovamente tutti i sottotitoli

**Con il backup system**:
1. Prima di cancellare la cartella del film, i file `.srt` vengono copiati in `.subtitles_backup/`
2. Quando rigenero il film, i sottotitoli vengono ripristinati automaticamente
3. **Nessuna perdita di dati, anche con ripristini parziali**

---

## Come funziona

### Struttura Backup (FLAT)

```
/app/data/movies/
  ├── .subtitles_backup/              ← Directory backup nascosta
  │   ├── Inception (2010)/
  │   │   ├── Inception (2010).en.srt
  │   │   └── Inception (2010).it.srt
  │   ├── The Matrix (1999)/
  │   │   └── The Matrix (1999).en.srt
  │   └── ...
  ├── 2001-plus/
  │   └── Inception (2010)/
  │       ├── Inception (2010).strm
  │       ├── Inception (2010).en.srt  ← Ripristinato dal backup
  │       └── Inception (2010).it.srt  ← Ripristinato dal backup
  └── ...
```

### Flusso di lavoro

#### 1️⃣ **Cancellazione film** (deseleziono categoria)

```javascript
// In deleteStrmFile()
await backupSubtitles(movie.folder_path);  // Backup .srt PRIMA di cancellare
await fs.rm(movie.folder_path, { recursive: true });  // Cancella tutto
```

**Cosa succede**:
- Scansiona la cartella del film per file `.srt`
- Copia tutti i `.srt` in `.subtitles_backup/{movie_name}/`
- Cancella la cartella del film (inclusi `.strm` e `.srt`)
- I sottotitoli sono al sicuro nel backup

#### 2️⃣ **Creazione film** (riseleziono categoria o importo nuovamente)

```javascript
// In createStrmFile()
await fs.writeFile(strmFilePath, movie.url);  // Crea .strm
await restoreSubtitles(folderPath);  // Ripristina .srt dal backup
```

**Cosa succede**:
- Crea la cartella del film e il file `.strm`
- Cerca in `.subtitles_backup/{movie_name}/` se esistono `.srt`
- Copia i `.srt` dal backup alla cartella del film
- **Non sovrascrive** se il file `.srt` esiste già (es: Emby ha già scaricato una versione più recente)

---

## Ripristino parziale e persistenza backup

⚠️ **IMPORTANTE**: I backup sono **permanenti** e non vengono cancellati automaticamente dopo il ripristino.

### Come funziona la persistenza

Il sistema usa `copyFile()` invece di `rename()`, quindi:
- ✅ Il backup rimane in `.subtitles_backup/` dopo il ripristino
- ✅ Puoi cancellare e ripristinare lo stesso film più volte senza perdere i sottotitoli
- ✅ Il backup funge da "cache permanente" dei sottotitoli

**Esempio pratico**:
```
1. Cancello "Inception (2010)" → Backup creato in .subtitles_backup/
2. Ripristino "Inception (2010)" → Sottotitoli COPIATI dal backup
3. Cancello di nuovo "Inception (2010)" → Backup già presente (sovrascrive se esistono .srt più recenti)
4. Ripristino di nuovo → Sottotitoli sempre disponibili dal backup
```

### Ripristini parziali

Il sistema funziona perfettamente anche con ripristini parziali:

**Scenario**:
1. Cancello 1000 film → 1000 backup `.srt` creati
2. Ripristino 300 film → 300 `.srt` ripristinati dal backup
3. **Tutti i 1000 backup rimangono disponibili** (anche quelli già ripristinati)
4. Ripristino altri 200 film → altri 200 `.srt` ripristinati
5. Tutti i 1000 backup ancora disponibili per futuri usi

### Vantaggi della persistenza

✅ **Zero perdita dati**: Anche cancellando/ripristinando più volte, i sottotitoli sono sempre disponibili
✅ **Performance**: Non serve ri-scaricare i sottotitoli da Emby ogni volta
✅ **Affidabilità**: Funge da backup di sicurezza permanente
✅ **Flessibilità**: Puoi sperimentare con year libraries senza perdere sottotitoli

---

## Compatibilità Year Libraries

Il sistema funziona sia con struttura FLAT che con Year Organization:

### FLAT structure (default)
```
Backup: .subtitles_backup/Inception (2010)/
Film:   /app/data/movies/Inception (2010)/
```

### Year-organized structure
```
Backup: .subtitles_backup/Inception (2010)/  ← Sempre FLAT
Film:   /app/data/movies/2001-plus/Inception (2010)/  ← Con year library
```

**Vantaggi**:
- Il backup usa il nome film come chiave (univoco)
- Indipendente dalla year library → funziona anche se cambi configurazione
- Se sposti un film tra year libraries, il backup funziona comunque

---

## Logging

Il sistema logga tutte le operazioni per debug:

```bash
# Backup
[MovieService] ✓ Backed up 2 subtitle(s) for "Inception (2010)"

# Restore
[MovieService] ✓ Restored 2 subtitle(s) for "Inception (2010)"

# Nessun backup trovato (normale)
# (nessun log, silenzioso)

# Errori
[MovieService] Warning: Could not backup subtitles for "Film XYZ": <error>
```

---

## Gestione spazio disco

⚠️ **ATTENZIONE**: I backup sono **permanenti** e **NON vengono cancellati automaticamente**.

### Dimensione tipica

- File `.srt` medio: ~50-100 KB
- 1000 film con 2 sottotitoli ciascuno: ~100-200 MB
- Trascurabile rispetto ai film (GB)

### Quando i backup occupano troppo spazio

Se la directory `.subtitles_backup/` diventa troppo grande, puoi fare pulizia manuale:

#### Opzione 1: Elimina backup di film rimossi dal database

```bash
# Accedi al container
docker exec -it iptv-manager sh

# Elenca backup
ls -la /app/data/movies/.subtitles_backup/

# Elimina backup specifico (film non più nel database)
rm -rf /app/data/movies/.subtitles_backup/"Nome Film (Anno)"
```

#### Opzione 2: Elimina TUTTI i backup (reset completo)

⚠️ **ATTENZIONE**: Questa operazione è irreversibile!

```bash
# Elimina TUTTI i backup
docker exec -it iptv-manager rm -rf /app/data/movies/.subtitles_backup/
```

Dopo questa operazione:
- I sottotitoli attualmente presenti nei film rimangono intatti
- Se cancelli e ripristini film, i sottotitoli dovranno essere ri-scaricati da Emby

### Strategia consigliata

**Lascia i backup permanenti** a meno che:
- ❌ Hai problemi di spazio disco (raro: ~200MB per 1000 film)
- ❌ Hai rimosso definitivamente molti film dal database
- ❌ Non usi più alcune categorie di film

**I backup sono utili perché**:
- ✅ Permettono di sperimentare con year libraries senza perdite
- ✅ Proteggono da cancellazioni accidentali
- ✅ Evitano re-download da Emby
- ✅ Occupano pochissimo spazio

---

## FAQ

### Q: I backup vengono eliminati dopo il ripristino?
**A**: **NO, i backup sono permanenti**.

Il sistema usa `copyFile()` invece di `rename()`, quindi:
- Il backup rimane in `.subtitles_backup/` anche dopo il ripristino
- Puoi cancellare e ripristinare lo stesso film infinite volte senza perdere i sottotitoli
- Il backup funge da **cache permanente** e backup di sicurezza

**Questo è intenzionale** per garantire massima affidabilità e zero perdita dati.

### Q: Cosa succede se modifico manualmente i sottotitoli?
**A**:
- Se cancelli i film, il backup salva la versione attuale (modificata)
- Al ripristino, ricevi la versione modificata
- **Non sovrascrive** se Emby ha già scaricato una nuova versione

### Q: Funziona con altri file (NFO, immagini)?
**A**: Attualmente supporta solo file `.srt`. Per estendere ad altri formati:

```javascript
// In backupSubtitles() e restoreSubtitles()
const files = await fs.readdir(movieDir);
const mediaFiles = files.filter(f =>
  f.toLowerCase().endsWith('.srt') ||
  f.toLowerCase().endsWith('.nfo') ||
  f.toLowerCase().endsWith('.jpg') ||
  f.toLowerCase().endsWith('.png')
);
```

### Q: Il backup funziona durante l'import M3U?
**A**: No, l'import M3U aggiorna solo il database, non tocca il filesystem. Il backup/restore si attiva solo durante:
- Deseleziona categoria (cancellazione `.strm`)
- Riseleziona categoria (creazione `.strm`)
- Sync filesystem manuale

---

## Implementazione tecnica

### File modificato
- `backend/src/services/movieService.js`

### Funzioni aggiunte
1. `backupSubtitles(movieDir)` - Copia `.srt` in backup prima della cancellazione
2. `restoreSubtitles(movieDir)` - Ripristina `.srt` dal backup dopo la creazione

### Funzioni modificate
1. `deleteStrmFile()` - Chiama `backupSubtitles()` prima di `fs.rm()`
2. `createStrmFile()` - Chiama `restoreSubtitles()` dopo `fs.writeFile()`
3. `syncFilesystemFromDb()` - Integra backup/restore nel sync massivo

### Directory backup
- Path: `{moviesDirectory}/.subtitles_backup/`
- Struttura: FLAT (nome film come key)
- Visibilità: Nascosta (prefix `.`)
- Persistenza: Manuale (no auto-cleanup)

---

## Testing manuale

### Test 1: Backup e restore base

1. Crea un film con sottotitoli:
```bash
docker exec -it iptv-manager sh
mkdir -p /app/data/movies/test-movie
echo "http://stream.test" > /app/data/movies/test-movie/test-movie.strm
echo "Subtitle test EN" > /app/data/movies/test-movie/test-movie.en.srt
echo "Subtitle test IT" > /app/data/movies/test-movie/test-movie.it.srt
```

2. Deseleziona categoria (triggera `deleteStrmFile()`)
3. Verifica backup:
```bash
ls -la /app/data/movies/.subtitles_backup/test-movie/
```

4. Riseleziona categoria (triggera `createStrmFile()`)
5. Verifica restore:
```bash
ls -la /app/data/movies/test-movie/
cat /app/data/movies/test-movie/test-movie.en.srt
```

### Test 2: Ripristino parziale

1. Importa 1000 film
2. Deseleziona categoria → 1000 backup creati
3. Riseleziona solo metà categoria → 500 restore
4. Verifica che rimangano 500 backup non utilizzati

---

## Versione
- Implementato: 2025-10-22
- Versione IPTV Manager: v0.9.6+
- Backward compatible: Sì (nessuna migration DB richiesta)

---

## Riferimenti
- Issue: Preservazione file .srt durante cancellazione/ripristino film
- PR: [Link se applicabile]
- Discussione: [Link se applicabile]
