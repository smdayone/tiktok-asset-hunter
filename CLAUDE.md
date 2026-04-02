# CLAUDE.md — Istruzioni per Claude Code

## Progetto
tiktok-asset-hunter — download batch video TikTok per ricerca competitor dropshipping

## Sistema operativo
Windows 11 — usa comandi Windows/PowerShell quando possibile
Path SSD esterno: E:\TikTok\ (verifica la lettera drive prima di operare)

## Regole operative
- NON committare file .txt con URL (contengono dati temporanei)
- NON committare file .mp4 o video di qualsiasi formato
- NON committare log CSV
- Prima di ogni download, verifica che l'SSD sia montato
- Usa `python` (non `python3`) su Windows salvo diversa indicazione

## Script principali
- `scripts/tiktok_url_collector.js` — incollare nella console browser
- `scripts/tiktok_batch_download.py` — eseguire da PowerShell/CMD

## Path SSD
Struttura attesa: E:\TikTok\[keyword]\
Se il drive letter cambia, aggiornare il path nel comando --out

## Commit message format
feat: descrizione breve
fix: descrizione breve
docs: descrizione breve
