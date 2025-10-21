# ⚡ Quick Start - IPTV Manager

## 🚀 Deploy in 2 Minuti

### Su Server Remoto (Linux)

```bash
# 1. Crea directory
mkdir -p ~/iptv-manager/data/{output,epg}
cd ~/iptv-manager

# 2. Crea docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  iptv-manager:
    image: fpipio/iptv-manager:latest
    container_name: iptv-manager
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - /media/movies:/app/movies  # Modifica questo path!
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/database.sqlite
      - OUTPUT_PATH=/app/data/output
    networks:
      - iptv-network
networks:
  iptv-network:
    driver: bridge
EOF

# 3. Avvia
docker-compose up -d

# 4. Verifica
docker logs iptv-manager | tail -20
```

### Accedi

Apri browser: **http://your-server-ip:3000**

### Configurazione Iniziale

1. Vai su **Movies** page
2. Imposta **STRM Output Directory**: `/app/movies`
3. Clicca **Save**
4. Fai refresh per verificare persistenza ✅

---

## 🔄 Aggiornamento

```bash
cd ~/iptv-manager
docker pull fpipio/iptv-manager:latest
docker-compose down && docker-compose up -d
```

---

## 📖 Documentazione Completa

Vedi [DEPLOYMENT.md](./DEPLOYMENT.md) per guida dettagliata

---

## 🐛 Problemi?

```bash
# Verifica log
docker logs iptv-manager -f

# Verifica migrations
docker logs iptv-manager | grep "008_add_movies_directory"

# Test API
curl http://localhost:3000/api/movies/config
```

---

**IMPORTANTE:** Database deve stare su disco locale, NON su NFS!
