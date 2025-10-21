# 🚀 Guida Deployment IPTV Manager

## 📋 Prerequisiti Server

- Docker e Docker Compose installati
- Disco locale per database (SSD consigliato)
- (Opzionale) NFS/SMB share per movies

---

## 🛠️ Setup Server da Zero

### Step 1: Preparazione Directory

```bash
# Sul server remoto

# Crea directory progetto su disco locale (NON su NFS!)
mkdir -p ~/iptv-manager
cd ~/iptv-manager

# Crea sottodirectory per dati
mkdir -p data/output data/epg
```

### Step 2: Crea docker-compose.yml

```bash
cd ~/iptv-manager
nano docker-compose.yml
```

Copia e modifica questa configurazione:

```yaml
version: '3.8'

services:
  iptv-manager:
    image: fpipio/iptv-manager:latest
    container_name: iptv-manager
    restart: unless-stopped
    ports:
      - "3000:3000"  # Modifica la porta se necessario
    volumes:
      # Database su disco locale (IMPORTANTE: NON usare NFS!)
      - ./data:/app/data

      # EPG grabber (decommentare se lo usi)
      # - ./epg-grabber:/app/epg-grabber

      # Movies su NFS/Network Share
      # Modifica /media/movies con il tuo path
      - /media/movies:/app/movies
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/database.sqlite
      - OUTPUT_PATH=/app/data/output
    networks:
      - iptv-network

networks:
  iptv-network:
    driver: bridge
```

**IMPORTANTE - Configurazione Volumi:**

- ✅ `./data:/app/data` → **Database su disco locale** (veloce, stabile)
- ✅ `/media/movies:/app/movies` → **Film su NFS** (solo file .strm)
- ❌ **MAI mettere database su NFS** → rischio corruzione e performance scarse

Salva il file (CTRL+O, CTRL+X in nano)

### Step 3: Avvia Container

```bash
cd ~/iptv-manager

# Pull immagine
docker pull fpipio/iptv-manager:latest

# Avvia container
docker-compose up -d

# Verifica log
docker logs iptv-manager

# Dovresti vedere:
# Running database migrations...
#   ✓ 001_initial_schema.sql completed
#   ✓ 002_add_unassigned_group.sql completed
#   ...
#   ✓ 008_add_movies_directory_config.sql completed
# Migrations completed successfully!
# 🚀 IPTV Manager Server running on port 3000
```

### Step 4: Verifica Installazione

```bash
# 1. Container in esecuzione
docker ps | grep iptv-manager

# 2. Migrations eseguite
docker logs iptv-manager | grep "Migrations completed"

# 3. Database creato
ls -lh ~/iptv-manager/data/database.sqlite

# 4. Test API
curl http://localhost:3000/api/movies/config

# Risposta attesa:
# {"success":true,"data":{"movies_directory":"/app/data/movies"}}
```

### Step 5: Configurazione Iniziale

Apri il browser:

```
http://your-server-ip:3000
```

**Configura Movies Directory:**

1. Vai su **Movies** page
2. Imposta **STRM Output Directory** su: `/app/movies`
3. Clicca **Save**
4. Fai refresh (F5) per verificare che persista

**IMPORTANTE:** Usa `/app/movies` (path nel container) non `/media/movies` (path host)!

### Step 6: (Opzionale) Configurazione EPG

Se usi EPG grabber:

```bash
# Sul server, copia epg-grabber nella directory progetto
cd ~/iptv-manager
git clone https://github.com/iptv-org/epg.git epg-grabber
cd epg-grabber
npm install

# Decommentare nel docker-compose.yml:
# - ./epg-grabber:/app/epg-grabber

# Riavvia container
docker-compose down
docker-compose up -d
```

---

## 🔄 Aggiornamento Immagine

```bash
cd ~/iptv-manager

# Pull nuova versione
docker pull fpipio/iptv-manager:latest

# Ricrea container (mantiene dati)
docker-compose down
docker-compose up -d

# Verifica
docker logs iptv-manager -f
```

---

## 📁 Struttura Directory Server

```
~/iptv-manager/                    ← Directory progetto (disco locale)
├── docker-compose.yml
├── data/                          ← Database + configurazioni (LOCALE)
│   ├── database.sqlite
│   ├── output/
│   │   └── playlist.m3u
│   └── epg/
│       └── guide.xml
└── epg-grabber/                   ← EPG grabber (opzionale, LOCALE)
    ├── sites/
    └── ...

/media/movies/                     ← NFS/Network Share (solo .strm)
├── Movie Title 1/
│   └── Movie Title 1.strm
├── Movie Title 2/
│   └── Movie Title 2.strm
└── ...
```

---

## 🐛 Troubleshooting

### Problema: Configurazione Movies Directory non persiste

**Causa:** Database su NFS o migrations non eseguite

**Soluzione:**
```bash
# Verifica database su disco locale
ls -lh ~/iptv-manager/data/database.sqlite

# Verifica migrations
docker logs iptv-manager | grep "008_add_movies_directory"

# Se non eseguita, forza ricreazione DB
docker-compose down
rm ~/iptv-manager/data/database.sqlite
docker-compose up -d
```

### Problema: Migration 008 non viene eseguita

**Causa:** Immagine Docker non aggiornata

**Soluzione:**
```bash
docker pull fpipio/iptv-manager:latest
docker-compose down
docker-compose up -d
```

### Problema: Tabella epg_config non esiste

**Causa:** Database vecchio senza migrations

**Soluzione:**
```bash
# Backup database
cp ~/iptv-manager/data/database.sqlite ~/iptv-manager/data/database.sqlite.backup

# Forza re-esecuzione migrations
docker exec iptv-manager sqlite3 /app/data/database.sqlite "DROP TABLE migrations;"
docker-compose restart

# Verifica
docker logs iptv-manager | grep "Migration"
```

### Problema: Permission denied sul volume

**Soluzione:**
```bash
# Dai permessi corretti alla directory data
sudo chown -R $(whoami):$(whoami) ~/iptv-manager/data
```

---

## 📊 Verifica Salute Sistema

```bash
# Script verifica completa
cd ~/iptv-manager

echo "=== IPTV Manager Health Check ==="
echo ""

# Container status
echo "1. Container Status:"
docker ps --filter name=iptv-manager --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Database
echo "2. Database:"
ls -lh data/database.sqlite
echo ""

# Migrations
echo "3. Migrations eseguite:"
docker exec iptv-manager sqlite3 /app/data/database.sqlite "SELECT filename FROM migrations ORDER BY filename;" | tail -5
echo ""

# Config
echo "4. Movies Directory Config:"
docker exec iptv-manager sqlite3 /app/data/database.sqlite "SELECT value FROM epg_config WHERE key = 'movies_directory';"
echo ""

# API Test
echo "5. API Test:"
curl -s http://localhost:3000/api/movies/config | grep -q movies_directory && echo "✓ API OK" || echo "✗ API Failed"
echo ""

# Disk space
echo "6. Disk Space:"
df -h ~/iptv-manager/data | tail -1
echo ""

echo "=== End Health Check ==="
```

---

## 🔐 Backup e Restore

### Backup

```bash
# Backup completo
cd ~/iptv-manager
tar -czf iptv-manager-backup-$(date +%Y%m%d).tar.gz data/

# Backup solo database
cp data/database.sqlite data/database.sqlite.backup-$(date +%Y%m%d)
```

### Restore

```bash
# Restore da backup
cd ~/iptv-manager
docker-compose down
tar -xzf iptv-manager-backup-YYYYMMDD.tar.gz
docker-compose up -d
```

---

## 📞 Link Utili

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Playlist M3U**: http://localhost:3000/output/playlist.m3u
- **EPG Guide**: http://localhost:3000/epg/guide.xml

---

## 🎯 Checklist Post-Deploy

- [ ] Container in esecuzione (`docker ps`)
- [ ] Migrations completate (008 inclusa)
- [ ] Database su disco locale (non NFS)
- [ ] API risponde correttamente
- [ ] Movies Directory configurata su `/app/movies`
- [ ] Config persiste dopo restart
- [ ] UI accessibile da browser
- [ ] Test import M3U funzionante
- [ ] File .strm creati in NFS share

---

**Versione Corrente**: v0.8.2
**Data Ultima Modifica**: 2025-10-20
