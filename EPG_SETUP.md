# EPG Setup Guide

## Panoramica

L'integrazione EPG è stata implementata con un'architettura **standalone service**, che permette di usare il tool open-source [`iptv-org/epg`](https://github.com/iptv-org/epg) come servizio esterno.

**Status Attuale**: Base EPG completamente implementata (v0.4.0-beta)
- ✅ Database EPG (sources, logs, config)
- ✅ Backend service con API completa
- ✅ Frontend UI completa (`/epg`)
- ⚠️ EPG grab è **placeholder** (genera XML vuoto)

Per ottenere dati EPG reali, segui questa guida.

---

## Architettura

```
iptv-manager/
├── backend/              # Nostro backend (gestisce EPG)
├── frontend/             # Nostro frontend (UI EPG)
├── epg-grabber/          # Clone di iptv-org/epg (servizio esterno)
│   ├── channels.xml      # Generato automaticamente dal nostro DB
│   └── guide.xml         # Output EPG (letto dal nostro backend)
└── data/
    └── epg/
        └── guide.xml     # Copia finale servita via API
```

**Flusso**:
1. Backend genera `epg-grabber/channels.xml` dai canali nel DB
2. Esegui `npm run grab` in `epg-grabber/` (o via API)
3. `iptv-org/epg` scarica dati EPG e genera `guide.xml`
4. Backend copia `guide.xml` in `data/epg/` e lo serve via `/api/epg/xml`
5. Export M3U include `url-tvg="http://localhost:3000/api/epg/xml"`

---

## Setup Manuale (Opzione 1)

### Step 1: Clone iptv-org/epg

```bash
# Dalla root del progetto
git clone --depth 1 https://github.com/iptv-org/epg.git epg-grabber
cd epg-grabber
npm install
```

### Step 2: Test EPG Grabber

```bash
# Test grab da un sito (esempio: tvguide.com)
npm run grab -- --site=tvguide.com

# Output: guide.xml verrà creato nella directory corrente
```

### Step 3: Integrazione con IPTV Manager

**Opzione A - Manuale**:
1. Vai su `http://localhost:3000/epg`
2. Clicca "Grab All Sources" per generare `channels.xml`
3. Vai in `epg-grabber/` e esegui `npm run grab -- --channels=channels.xml --output=../data/epg/guide.xml`

**Opzione B - Script automatico** (da implementare):
```bash
# TODO: Creare script bash/node che:
# 1. Chiama API /api/epg/grab/:sourceId
# 2. Backend genera channels.xml
# 3. Esegue npm run grab nella directory epg-grabber
# 4. Copia output in data/epg/
```

---

## Setup Automatico (Opzione 2 - Future)

### Step 1: Installare epg-grabber come Dependency

Modificare `backend/package.json`:

```json
{
  "dependencies": {
    "@iptv-org/epg": "latest"
  }
}
```

### Step 2: Modificare epgService.js

Sostituire il placeholder grab con:

```javascript
const { exec } = require('child_process');
const path = require('path');

async grabEpg(sourceId) {
  // ... existing code ...

  const grabCommand = `cd ${this.epgGrabberPath} && npx epg-grabber --site=${source.site_name} --channels=channels.xml --output=../data/epg/guide.xml --days=${days}`;

  await execAsync(grabCommand);

  // ... existing code ...
}
```

---

## Schedulazione Automatica (Future)

### Opzione: node-cron

Installare:
```bash
cd backend
npm install node-cron
```

Creare `backend/src/services/epgScheduler.js`:

```javascript
const cron = require('node-cron');
const epgService = require('./epgService');

function startEpgScheduler() {
  const config = await epgService.getConfig();

  if (config.auto_grab_enabled === '1') {
    const schedule = config.auto_grab_schedule; // es: "0 */6 * * *"

    cron.schedule(schedule, async () => {
      console.log('[EPG] Running scheduled grab...');

      const sources = await epgService.getAllSources();
      const enabledSources = sources.filter(s => s.enabled);

      for (const source of enabledSources) {
        try {
          await epgService.grabEpg(source.id);
        } catch (error) {
          console.error(`[EPG] Failed to grab ${source.site_name}:`, error);
        }
      }
    });
  }
}

module.exports = { startEpgScheduler };
```

Modificare `backend/src/server.js`:

```javascript
const { startEpgScheduler } = require('./services/epgScheduler');

// Dopo runMigrations()
startEpgScheduler();
```

---

## Configurazione Sorgenti EPG

### Siti Supportati

Il progetto `iptv-org/epg` supporta centinaia di siti. Esempi:

- `tvguide.com` (USA)
- `tvtv.de` (Germania)
- `xmltv.se` (Svezia)
- `teleguide.info` (Multi-region)
- ... [vedi lista completa](https://github.com/iptv-org/epg/tree/master/sites)

### Aggiungere una Sorgente

1. Vai su `http://localhost:3000/epg`
2. Clicca "Add Source"
3. Inserisci:
   - **Site Name**: Nome del sito (es: `tvguide.com`)
   - **Site URL** (opzionale): URL del sito
   - **Enabled**: Spunta per abilitare
4. Clicca "Add Source"

### Mapping tvg-id

I canali nel tuo M3U devono avere `tvg-id` che corrisponde agli ID EPG del sito.

**Esempio**:
```m3u
#EXTINF:-1 tvg-id="ABC.us" tvg-logo="..." group-title="USA",ABC Channel
http://example.com/stream
```

Il `tvg-id="ABC.us"` deve corrispondere all'ID nel database EPG del sito scelto.

---

## Export M3U con EPG

### Modificare exportService.js

Aggiungere header EPG nell'export M3U:

```javascript
// backend/src/services/exportService.js

async generateM3U(filename = 'playlist.m3u') {
  let m3uContent = '#EXTM3U\n';

  // Aggiungi EPG URL se disponibile
  const hasEpg = await epgService.hasEpgData();
  if (hasEpg) {
    const epgUrl = process.env.EPG_URL || 'http://localhost:3000/api/epg/xml';
    m3uContent += `#EXTM3U url-tvg="${epgUrl}"\n`;
  }

  // ... resto del codice ...
}
```

### Risultato

```m3u
#EXTM3U url-tvg="http://localhost:3000/api/epg/xml"
#EXTINF:-1 tvg-id="ABC.us" tvg-logo="..." group-title="USA",ABC Channel
http://example.com/stream
```

I player IPTV (VLC, Kodi, TiviMate, ecc.) leggeranno automaticamente l'EPG da `url-tvg`.

---

## Testing

### Test 1: Generazione channels.xml

```bash
curl http://localhost:3000/api/epg/status
# Verifica che channels_count > 0
```

### Test 2: Grab Manuale

```bash
cd epg-grabber
npm run grab -- --site=tvguide.com --channels=channels.xml
# Verifica che guide.xml sia stato creato
```

### Test 3: Serve EPG XML

```bash
curl http://localhost:3000/api/epg/xml
# Dovrebbe restituire XML XMLTV format
```

### Test 4: Import M3U in Player

1. Genera M3U con EPG URL
2. Importa in un IPTV player (es: VLC)
3. Verifica che i programmi TV siano visibili

---

## Troubleshooting

### Problema: "No EPG data available"

**Causa**: `guide.xml` non è stato generato o è vuoto.

**Soluzione**:
1. Controlla che `epg-grabber/` sia installato
2. Esegui grab manuale
3. Verifica log: `GET /api/epg/logs`

### Problema: "EPG grab fails"

**Causa**: Sito EPG non raggiungibile o `tvg-id` non validi.

**Soluzione**:
1. Verifica che il sito sia nella [lista supportata](https://github.com/iptv-org/epg/tree/master/sites)
2. Controlla i `tvg-id` nei tuoi canali
3. Aumenta timeout in config EPG

### Problema: "Player non mostra programmi"

**Causa**: `tvg-id` non corrispondono tra M3U e EPG.

**Soluzione**:
1. Apri `data/epg/guide.xml` e cerca i `channel id`
2. Modifica `tvg-id` nei canali per farli corrispondere
3. Re-export M3U

---

## Risorse

- [iptv-org/epg GitHub](https://github.com/iptv-org/epg)
- [XMLTV Format Specification](http://wiki.xmltv.org/index.php/XMLTVFormat)
- [IPTV-Org Database](https://github.com/iptv-org/database)

---

## Roadmap Future

- [ ] Script automatico installazione epg-grabber
- [ ] Integrazione grab via API (no comando manuale)
- [ ] Schedulazione automatica con node-cron
- [ ] UI per mapping manuale tvg-id
- [ ] Cache programmi EPG in database
- [ ] Statistiche EPG (copertura canali, programmi disponibili)
- [ ] Docker multi-container (epg-grabber come servizio separato)

---

**Ultimo Aggiornamento**: 2025-10-17
**Versione IPTV Manager**: v0.4.0-beta
