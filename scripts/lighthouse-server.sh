#!/bin/sh
# Lighthouse için üretim sunucusu: `next start` açılır, verilen URL'ler ölçümden önce bir kez ısıtılır,
# sonra LIGHTHOUSE_READY basılır (lighthouserc.cjs bunu bekler). LHCI bitince süreç ağacını kendisi kapatır.
# Sebep: ilk istekte rota modülleri ve Prisma bağlantısı yüklenirken CI runner'ın CPU'su Lighthouse'un
# ilk koşusuyla çakışıyordu ("/" ilk koşu 0,63, TBT 2,4 s; sonrakiler 0,93).
# Kullanım: sh scripts/lighthouse-server.sh URL1 [URL2 ...]   (port: PORT ortam değişkeni, varsayılan 3000)
set -eu
[ "$#" -ge 1 ] || { echo "Kullanım: $0 URL..." >&2; exit 2; }

pnpm start &
server=$!
# Hata yolunda sunucu yetim kalmasın; normal yolda LHCI zaten kapatmış olur.
trap 'kill "$server" 2>/dev/null || true' EXIT

tries=0
until curl -sfo /dev/null "$1"; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo "Sunucu 60 s içinde yanıt vermedi: $1" >&2
    exit 1
  fi
  sleep 1
done

for url in "$@"; do
  curl -sfo /dev/null "$url" || { echo "Isıtma başarısız: $url" >&2; exit 1; }
done

echo LIGHTHOUSE_READY
wait "$server"
