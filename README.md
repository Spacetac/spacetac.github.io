# Spacetac

Weltraum-Strategiespiel im Browser. Kein Build-Schritt nötig: `index.html` öffnen oder den Ordner auf GitHub Pages hochladen.

## Struktur
- `index.html` – Seitengerüst (HUD, Menüs)
- `css/` – Styles (Basis, Tooltips, Navigationsbuttons)
- `js/core/` – Spielkern in Ladereihenfolge (Daten, Welt, Flotten, KI, Simulation, Rendering, Speichern, UI)
- `js/features/` – Erweiterungen (Schilde/Raketen, Sound, Touch-Steuerung, Einstellungen, ...)

Die Skripte teilen sich den globalen Scope und müssen in der Reihenfolge aus `index.html` geladen werden.

## Spielgeschwindigkeit
`SPDX` in `js/core/02-data.js` skaliert die Flottengeschwindigkeit (Standard 1,2). Zusätzlich gibt es den Tempo-Button (0,5x bis 10x).
