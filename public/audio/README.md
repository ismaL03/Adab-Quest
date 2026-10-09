# Fichiers audio

Déposez ici les enregistrements (mp3, ogg, opus, m4a, aac, wav, webm) :

- `letters/<id>.mp3` — nom de chaque lettre (ex. `letters/ba.mp3`)
- `syllables/<clé>.mp3` — syllabes (ex. `syllables/ba-fatha.mp3`)
- `words/<slug>.mp3` — mots de vocabulaire (ex. `words/kataba.mp3`)
- `quran/wbw/SSS_AAA_MMM.mp3` — mots du Coran (sourate_verset_mot)

`npm run audio:list` écrit la liste complète des sons attendus dans `docs/audio-attendus.txt`.
Après ajout, lancez `npm run audio:manifest` (automatique avec `npm run dev` / `npm run build`).

Les enregistrements actuels des lettres, syllabes (fatha, kasra, damma) et mots-clés
proviennent de https://github.com/bubblesinarabic/alphabets-audio (sans licence
précisée : voir la section « Données, polices et licences » du README principal).
