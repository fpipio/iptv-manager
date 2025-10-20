# EPG Multi-Source Matching System - User Guide

## Overview

Il sistema di **EPG Multi-Source Matching** permette di mappare automaticamente i canali M3U alle sorgenti EPG disponibili, ottimizzando il processo di grab della guida TV.

### Vantaggi

- **Efficienza**: Grab solo dei canali necessari (non interi cataloghi EPG)
- **Performance**: Meno tempo, meno spazio disco, meno banda
- **Flessibilità**: Supporto multi-source con priorità configurabile
- **Intelligenza**: Matching automatico con fallback fuzzy
- **Controllo**: Override manuale quando necessario

---

## Workflow Completo

```
1. Import M3U playlist
   ↓
2. Sync EPG Sources (carica .channels.xml disponibili)
   ↓
3. Auto-Match Channels (tvg-id → EPG channels)
   ↓
4. Generate custom.channels.xml (solo canali matched + exported)
   ↓
5. Grab EPG (npm run grab --channels=custom.channels.xml)
   ↓
6. Export M3U (con url-tvg header)
```

---

## Setup Iniziale

### 1. Configurare EPG Sources

Vai su **EPG Settings** (`/epg`) e aggiungi le sorgenti EPG disponibili:

**Esempio**:
- `raiplay.it` (Priority: 1) - Canali RAI ufficiali
- `superguidatv.it` (Priority: 2) - Guida TV italiana
- `guida.tv` (Priority: 3) - Guida TV generica

**Note**:
- La priorità determina quale source usare quando ci sono match multipli
- Priority 1 = massima priorità (preferita)
- Solo sources attive (`is_active = 1`) vengono considerate

### 2. Sync EPG Sources

Vai su **EPG Matching** (`/epg/matching`) e clicca **"Sync EPG Sources"**.

Questo comando:
1. Scansiona `epg-grabber/sites/*/` per file `.channels.xml`
2. Parsa i canali disponibili da ogni source
3. Popola la tabella `epg_source_channels` nel database

**Risultato**: Database aggiornato con tutti i canali EPG disponibili.

---

## Auto-Matching

### 3. Run Auto-Matching

Clicca **"Run Auto-Matching"** per mappare automaticamente i canali M3U ai canali EPG.

#### Algoritmo di Matching

```javascript
Per ogni canale M3U con tvg-id:
  1. Cerca exact match su xmltv_id (priorità source)
  2. [Opzionale] Fuzzy match su nome canale (fallback)
  3. Se trovato → crea mapping automatico
  4. Se non trovato → canale resta unmapped
```

#### Opzioni

- **Use Fuzzy Matching**: Abilita matching basato su similarità nome (Levenshtein distance)
- **Overwrite Manual**: Sovrascrive anche i mapping manuali esistenti

**Risultato**: Statistiche matching (exact, fuzzy, unmapped, skipped).

---

## Gestione Mapping

### 4. Visualizzare Mappings

La tabella **Channel Mappings** mostra:

| Colonna | Descrizione |
|---------|-------------|
| M3U Channel | Nome canale dalla playlist |
| TVG-ID | Identificatore tvg-id |
| EPG Source | Sorgente EPG matched (es: `raiplay.it`) |
| EPG Channel | Canale EPG matched (display_name) |
| Match | Qualità match (`exact`, `fuzzy`, `manual`) |
| Actions | Change, Remove |

**Colori**:
- Bianco: Canale mappato correttamente
- Arancione: Canale unmapped (nessun match trovato)

### 5. Override Manuale

Se l'auto-matching non trova il canale giusto:

1. Click su **"Change"** nella colonna Actions
2. Modale mostra **alternative sources** disponibili per quel tvg-id
3. Seleziona la source preferita
4. Mapping aggiornato con `match_quality = 'manual'` e `is_manual = 1`

**Use Case**:
- Due sources hanno stesso xmltv_id ma qualità diversa
- Preferisci una source specifica per un canale

### 6. Rimuovere Mapping

Click su **"Remove"** per eliminare un mapping.

Il canale torna in stato **unmapped** e non verrà incluso nel grab EPG.

---

## Generazione Custom XML

### 7. Generate Custom Channels XML

Clicca **"Generate Custom XML"** per creare `epg-grabber/custom.channels.xml`.

Questo file contiene **solo i canali mappati + exported**.

**Esempio Output**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<channels>
  <channel site="raiplay.it" lang="it" xmltv_id="Rai1.it" site_id="rai-1">RAI 1</channel>
  <channel site="raiplay.it" lang="it" xmltv_id="Rai2.it" site_id="rai-2">RAI 2</channel>
  <channel site="superguidatv.it" lang="it" xmltv_id="Canale5.it" site_id="canale5">CANALE 5</channel>
</channels>
```

**Vantaggi**:
- Solo canali che ti interessano
- Grab molto più veloce (es: 50 canali vs 500)
- Meno spazio disco per guide.xml

---

## EPG Grab

### 8. Grab EPG Data

Clicca **"Grab EPG Data"** per eseguire il grab usando `custom.channels.xml`.

**Comando eseguito**:
```bash
npm run grab -- --channels=custom.channels.xml --output=/app/data/epg/guide.xml --days=1
```

**Parametri**:
- `days`: Giorni di dati da recuperare (default: 1)
- `maxConnections`: Connessioni simultanee (default: 1)
- `timeout`: Timeout richieste (default: 60000ms)

**Risultato**: File `guide.xml` generato con solo i programmi dei canali matched.

---

## Export M3U con EPG

### 9. Export con url-tvg

Quando esporti la playlist M3U, l'header include automaticamente:

```m3u
#EXTM3U url-tvg="http://localhost:3000/api/epg/xml"
```

**Configurazione IPTV Player**:
1. Importa playlist M3U esportata
2. L'app IPTV legge automaticamente l'header `url-tvg`
3. Scarica `guide.xml` dal server
4. Mostra la guida TV per i canali matched

---

## Statistiche e Monitoraggio

### Dashboard Stats

- **Total Channels**: Canali M3U con tvg-id
- **Mapped**: Canali con mapping attivo
- **Unmapped**: Canali senza mapping
- **Manual Overrides**: Mapping creati manualmente

### EPG Channels Stats

- **Total EPG Channels**: Canali disponibili da tutte le sources
- **Active Sources**: Sources attive nel DB
- **Channels by Source**: Top 3 sources per numero canali

### Filtri

- **Show only unmapped**: Mostra solo canali senza mapping (per fix rapido)

---

## Troubleshooting

### Problema: Auto-matching non trova canali

**Cause possibili**:
1. EPG sources non sincronizzate → Run "Sync EPG Sources"
2. tvg-id M3U diverso da xmltv_id EPG → Check manualmente
3. Source non attiva → Verifica `is_active = 1` in EPG Settings

**Soluzione**: Usa override manuale o fuzzy matching.

---

### Problema: Custom XML vuoto

**Causa**: Nessun canale mapped o tutti i canali hanno `is_exported = 0`.

**Soluzione**:
1. Run auto-matching
2. Verifica canali exported in `/manage`

---

### Problema: Grab fallisce

**Causa**: Comando `npm run grab` fallisce (network, timeout, etc.).

**Soluzione**:
1. Check logs in **EPG Settings → Grab Logs**
2. Aumenta timeout o riduci maxConnections
3. Verifica connessione internet

---

## Esempio Scenario Reale

**Setup**:
- 50 canali M3U importati (RAI, Mediaset, Sky)
- 3 EPG sources configurate:
  - `raiplay.it`: 17 canali RAI
  - `superguidatv.it`: 200+ canali italiani
  - `guida.tv`: 500+ canali internazionali

**Workflow**:
1. **Sync EPG Sources** → 717 canali EPG caricati
2. **Auto-Matching** → 42 match exact (17 RAI + 25 Mediaset)
3. **Manual Override** → 5 canali Sky matched manualmente
4. **Generate Custom XML** → 47 canali (42+5) in custom.channels.xml
5. **Grab EPG** → ~2 minuti (vs ~30 min per grab completo)
6. **Export M3U** → Playlist con url-tvg funzionante

**Risultato**:
- 94% canali matched (47/50)
- Grab time ridotto del 93%
- guide.xml: 15 KB (vs 5 MB)

---

## API Endpoints Reference

### EPG Channels

- `POST /api/epg/channels/sync` - Sync sources da filesystem
- `GET /api/epg/channels/stats` - Statistiche canali EPG
- `GET /api/epg/channels/source/:sourceId` - Canali per source

### Matching

- `POST /api/epg/matching/auto` - Run auto-matching
- `GET /api/epg/matching/all` - Tutti i mapping
- `GET /api/epg/matching/channel/:channelId` - Mapping singolo canale
- `GET /api/epg/matching/alternatives/:tvgId` - Alternative per tvg-id
- `POST /api/epg/matching/manual` - Crea mapping manuale
- `DELETE /api/epg/matching/channel/:channelId` - Rimuovi mapping
- `GET /api/epg/matching/stats` - Statistiche matching

### Grab

- `POST /api/epg/generate-custom-xml` - Genera custom.channels.xml
- `POST /api/epg/grab-custom` - Grab EPG con custom channels

---

## Best Practices

1. **Sync EPG Sources** dopo ogni aggiornamento di `epg-grabber/sites/`
2. **Run Auto-Matching** dopo ogni import M3U
3. **Verifica unmapped channels** prima di fare grab
4. **Manual override** per canali critici (es: canali premium)
5. **Grab EPG** con `days=1` per test, poi aumenta a `days=7` per produzione
6. **Monitor logs** per errori di grab

---

## Database Schema Reference

### epg_source_channels

Canali disponibili da ogni EPG source.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | TEXT | UUID |
| epg_source_id | TEXT | FK → epg_sources |
| site | TEXT | es: "raiplay.it" |
| lang | TEXT | es: "it" |
| xmltv_id | TEXT | es: "Rai1.it" (key per matching) |
| site_id | TEXT | es: "rai-1" |
| display_name | TEXT | es: "RAI 1" |

### channel_epg_mappings

Mapping canali M3U → EPG channels.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| channel_id | TEXT | FK → channels (M3U) |
| epg_source_channel_id | TEXT | FK → epg_source_channels |
| priority | INTEGER | Priorità source (1 = max) |
| is_manual | INTEGER | 0 = auto, 1 = manuale |
| match_quality | TEXT | "exact", "fuzzy", "manual" |

---

## Prossimi Sviluppi

- [ ] Schedulazione automatica grab (cron)
- [ ] Fuzzy matching con threshold configurabile
- [ ] Bulk actions (delete multiple mappings)
- [ ] Export mappings to JSON/CSV
- [ ] Import mappings from file
- [ ] EPG source health check (test connectivity)

---

**Versione**: 1.0.0 (2025-10-18)
**Autore**: IPTV Manager Team
