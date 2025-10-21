#!/bin/bash
# Script per verificare stato migrations sul server remoto

echo "=== IPTV Manager - Database Migrations Debug ==="
echo ""

echo "1. Container Status:"
docker ps -a | grep iptv-manager
echo ""

echo "2. Migrations Log (ultimi 50 righe):"
docker logs iptv-manager --tail 50 | grep -E "Running|Migration|✓|✗|008"
echo ""

echo "3. Database File Status:"
docker exec iptv-manager ls -lah /app/data/database.sqlite
echo ""

echo "4. Migrations Eseguite nel Database:"
docker exec iptv-manager sqlite3 /app/data/database.sqlite "SELECT filename, executed_at FROM migrations ORDER BY executed_at;"
echo ""

echo "5. Verifica chiave 'movies_directory' in epg_config:"
docker exec iptv-manager sqlite3 /app/data/database.sqlite "SELECT key, value FROM epg_config WHERE key = 'movies_directory';"
echo ""

echo "6. Tutte le chiavi in epg_config:"
docker exec iptv-manager sqlite3 /app/data/database.sqlite "SELECT key, value FROM epg_config ORDER BY key;"
echo ""

echo "7. Migrations disponibili nel container:"
docker exec iptv-manager ls -la /app/src/db/migrations/
echo ""
