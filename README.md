# As-Siraj — Gharib al-Qur'an

Application pour apprendre et réviser les mots de **Gharib al-Qur'an**, d'après
*السراج في بيان غريب القرآن* (د. محمد بن عبد العزيز الخضيري) : 6 109 mots, classés par sourate et par verset.

- **Apprendre** : les nouveaux mots, dans l'ordre du Mushaf, parmi les sourates choisies.
- **Réviser** : les mots marqués « à revoir » ; **Consolider** repasse aussi les mots maîtrisés.
- **Sourates** : tout le contenu, avec recherche et statut de chaque mot (nouveau → à réviser → maîtrisé).
- **Mot au déverrouillage** (Android) : un mot s'affiche à chaque déverrouillage du téléphone.

Tout fonctionne hors ligne ; la progression reste sur l'appareil.

## Développement

```sh
npm install
npm run dev            # version web
npm run android:sync   # build web + copie dans le projet Android (android/)
```

- `src/` — interface (React + TypeScript). `src/words.json` : `[sourate, verset, mot, sens]`.
- `android/` — projet Capacitor. Le déverrouillage est géré dans
  `android/app/src/main/java/com/siraj/gharib/` (`UnlockService`, `UnlockPlugin`, `BootReceiver`).
- `.github/workflows/android.yml` — compile l'APK à chaque push (artefact `as-siraj-apk`).
- `.github/workflows/pages.yml` — publie la version web depuis `main`.

## Source des données

Texte numérisé repris du jeu de données
[Tafsir-Kalimat-DB](https://github.com/Muhammad95959/Tafsir-Kalimat-DB). Les droits de l'ouvrage appartiennent
à son auteur et à son éditeur : leur accord est nécessaire avant toute diffusion publique de l'application.
