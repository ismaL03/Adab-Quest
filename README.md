# Iqra — Apprendre à lire l’arabe, jusqu’au Mushaf

**Iqra** (ٱقْرَأْ, « Lis ! ») est une application web **100 % gratuite**, au design premium, pour apprendre à lire l’arabe : des lettres isolées jusqu’à la lecture du Coran mot à mot, avec le code couleur du Tajweed.

- **Carte de progression** interactive façon Duolingo : 9 étapes, 45 leçons, déverrouillage progressif.
- **Apprentissage par l’écoute** (aucun micro, aucune reconnaissance vocale) : chaque lettre, syllabe et mot se touche pour être entendu, avec une animation d’onde synchronisée.
- **Vue Mushaf** : mise en page de Mushaf, couleurs Tajweed, mots cliquables (prononciation mot à mot), mise en évidence de la lettre, du signe ou de la règle étudiés.
- **Gamification** : XP, niveaux, séries quotidiennes, objectif du jour, étoiles, combos, 13 badges, confettis et particules.
- **Police coranique authentique** : KFGQPC HAFS Uthmanic Script (Complexe du Roi Fahd).
- Mode **clair / sombre / système**, glassmorphism discret, transitions fluides, responsive (mobile → bureau).
- Progression **sauvegardée localement** (aucun compte, aucune donnée envoyée).

---

## Démarrage

Prérequis : **Node.js ≥ 20**.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement (régénère d’abord le manifeste audio) |
| `npm run build` | Vérification TypeScript + build de production dans `dist/` |
| `npm run build:portable` | Build à chemins relatifs et routage par hash dans `dist-portable/` (GitHub Pages, sous-dossier, hébergement sans réécriture) |
| `npm run preview` | Sert le build de production localement |
| `npm test` | Tests unitaires (parcours, données coraniques, Tajweed, progression) |
| `npm run typecheck` | Vérification TypeScript seule |
| `npm run audio:manifest` | Recense les fichiers présents dans `public/audio/` |
| `npm run audio:list` | Idem + écrit `docs/audio-attendus.txt` (liste des sons à enregistrer) |
| `npm run audio:tts` | Régénère les sons intégrés par synthèse vocale (voir « Audio ») |
| `npm run quran:build` | Régénère les données coraniques (voir plus bas) |

## Stack technique

| Besoin | Choix | Pourquoi |
| --- | --- | --- |
| Interface | **React 19 + TypeScript** | Écosystème mature, typage strict de tout le parcours |
| Build | **Vite 7** | Démarrage instantané, découpage automatique : chaque sourate est un fichier chargé à la demande |
| Styles | **Tailwind CSS 4** + jetons CSS | Design system centralisé (`src/styles/index.css`), thème clair/sombre par variables |
| Animations | **Motion** (ex-Framer Motion) + canvas-confetti | Transitions à ressort, apparitions en cascade, particules, célébrations |
| État global | **Zustand** + `persist` | Progression et réglages sauvegardés dans `localStorage` |
| Routage | **React Router 7** | Écrans chargés à la demande (`lazy`) |
| Audio | Moteur maison (HTMLAudio + Web Audio) | Lecture instantanée, préchargement, chaîne de repli, effets sonores synthétisés |

## Architecture

```
src/
├── App.tsx                     Routage (createBrowserRouter) + mise en page racine
├── main.tsx                    Point d’entrée
├── styles/index.css            Design system : jetons, thèmes, polices, couleurs Tajweed
├── audio/
│   ├── engine.ts               Moteur audio (fichier local → audio distant → synthèse vocale)
│   ├── sounds.ts               Conventions de nommage des fichiers audio
│   ├── sfx.ts                  Effets sonores synthétisés (aucun fichier requis)
│   └── expected.ts             Inventaire des sons utilisés (pour `audio:list`)
├── store/
│   ├── progress.ts             Progression : XP, leçons, étoiles, séries, badges (persisté)
│   ├── settings.ts             Réglages : thème, Tajweed, audio… (persisté)
│   └── ui.ts                   État éphémère : notifications, animation de déverrouillage
├── data/
│   ├── letters.ts              28 lettres + hamza : nom, translittération, articulation
│   ├── badges.ts               Définition des badges
│   ├── curriculum/             Parcours pédagogique
│   │   ├── modules.ts          Les 9 étapes et leurs leçons
│   │   ├── builders.ts         Modèles de leçons et fabriques d’exercices
│   │   ├── items.ts            Lettres, syllabes, mots → éléments cliquables + sons
│   │   ├── words.ts            Vocabulaire vocalisé par notion
│   │   └── types.ts            Types des étapes (13 types d’exercices)
│   └── quran/
│       ├── surahs/NNN.json     114 sourates, mot à mot, avec annotations Tajweed
│       ├── loader.ts           Chargement à la demande + mise en cache
│       └── surahMeta.ts        Noms (arabe, translittération, français), versets, pages
├── features/
│   ├── map/ProgressMap.tsx     Carte de progression (chemin sinueux, nœuds, fiches)
│   ├── lesson/                 Lecteur de leçon, écran de fin, 13 types d’étapes
│   ├── mushaf/                 Vue Mushaf, mots, Tajweed, mise en évidence, légende
│   └── celebrate/              Confettis et gerbes de particules
├── components/                 AppShell, tuiles sonores, boutons, accueil, notifications
└── pages/                      Accueil, Leçon, Mushaf, Alphabet, Profil, 404
```

## Parcours pédagogique

La structure suit la progression de la méthode **« Ata‘allamu al-‘arabiyya »** (أتعلم العربية) de Cheikh Ayyoub (La Madrassah) : on avance du plus simple au plus complexe, en entendant puis en lisant.

| Étape | Contenu |
| --- | --- |
| 1. Les lettres isolées | 28 lettres + hamza, lettres sœurs (points), sons proches (léger / épais) |
| 2. Les voyelles courtes | Fatha, kasra, damma, les trois ensemble, lettres d’élévation |
| 3. Le soukoun | Lettre sans voyelle, soukoun après chaque voyelle, qalqala |
| 4. Les lettres liées | Lettres attachantes / non attachantes, formes début-milieu-fin, lecture de mots |
| 5. Les voyelles longues | Madd avec alif, yâ’, wâw ; alif suscrit (ـٰ ۥ ۦ) ; lettres douces (lîn) |
| 6. Le tanwîn | an · in · oun, distinction voyelle / tanwîn, mots |
| 7. La chadda | Lettre doublée, mots, ghunna |
| 8. L’article « al » | Lâm lunaire, lâm solaire, hamzat al-wasl |
| 9. Vers le Mushaf | Al-Fâtiha, Al-Ikhlâs, Al-Falaq, An-Nâs mot à mot, lecture des couleurs du Tajweed |

Chaque leçon combine plusieurs types d’exercices : présentation, fiche de lettre, découverte (écouter chaque élément), QCM auditif, QCM visuel, association de paires, « écoute et répète » avec lecture guidée (surlignage karaoké), assemblage de syllabes, tableau des formes, chasse dans le Mushaf, lecture d’un verset, « quel mot as-tu entendu ? », remise en ordre d’un verset.
Une question ratée revient automatiquement en fin de leçon.

**Adapter le contenu** : tout le parcours est décrit en données dans `src/data/curriculum/` (modules, mots, textes). Ajouter une leçon revient à appeler un des modèles (`letterGroupLesson`, `wordsLesson`, `surahLesson`…) ou à écrire ses étapes avec les fabriques de `builders.ts`. Les tests (`npm test`) vérifient la cohérence de chaque leçon (bonne réponse présente, options uniques, syllabes qui recomposent le mot…).

## Audio : du son sur tous les appareils

L’application **embarque ses propres sons** : 2 831 extraits (les 29 noms de lettres, toutes les syllabes, le vocabulaire et chaque mot d’Al-Fâtiha et de Juz ‘Amma), regroupés en 67 paquets MP3 dans `public/audio/packs/` (≈ 16 Mo). Ils sont lus avec la **Web Audio API**, ce qui fonctionne sur ordinateur, Android et iPhone/iPad, sans dépendre d’une voix installée sur l’appareil. Le son est déverrouillé au premier toucher (exigence des navigateurs mobiles).

Ces sons sont produits **hors ligne par synthèse vocale neuronale** (voix arabe Piper « kareem », moteur sherpa-onnx). L’écriture uthmanie est d’abord convertie en arabe vocalisé prononçable (`src/audio/speechText.ts` : alif de liaison, lâm solaire, alif suscrit, nom « Allâh »…). C’est une **voix de démonstration** : elle ne respecte pas toutes les règles du Tajweed et a vocation à être remplacée par de vrais enregistrements.

Ordre de priorité pour chaque élément cliquable :

1. **Votre enregistrement** `public/audio/<chemin>` s’il existe ;
2. pour les mots du Coran, la **récitation mot-à-mot de Quran.com** (en ligne, désactivable dans le profil) ;
3. le **son intégré** (paquets ci-dessus) ;
4. en dernier recours, la voix arabe de l’appareil.

Le retour visuel (onde, pulsation, halo) est synchronisé avec la lecture dans tous les cas, et la Vue Mushaf indique sous le mot touché quelle source a été entendue.

### Remplacer par de vrais enregistrements

1. `npm run audio:list` écrit dans `docs/audio-attendus.txt` la liste des sons utilisés, avec le texte arabe à enregistrer.
2. Déposez les fichiers dans `public/audio/` en respectant les chemins :

| Dossier | Contenu | Exemple |
| --- | --- | --- |
| `letters/` | Nom de chaque lettre | `letters/ba.mp3` → « bâ’ » |
| `syllables/` | Syllabes (clé = lettre + signes) | `syllables/ba-fatha.mp3` → « ba », `syllables/ba-fatha_alif-plain.mp3` → « bâ » |
| `words/` | Mots de vocabulaire | `words/kataba.mp3` → كَتَبَ |
| `quran/wbw/` | Mots du Coran (même nommage que Quran.com) | `quran/wbw/001_002_003.mp3` → sourate 1, verset 2, mot 3 |

3. Lancez `npm run audio:manifest` (fait automatiquement par `npm run dev` et `npm run build`). Chaque fichier déposé remplace le son intégré correspondant.

Les formats `.mp3`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.wav` et `.webm` sont reconnus.

### Régénérer les sons intégrés

Après une modification du parcours (nouveaux mots, nouvelles sourates dans `BUNDLED_SURAHS`) :

```bash
python3 -m venv .venv-tts && .venv-tts/bin/pip install -r scripts/tts/requirements.txt
curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ar_JO-kareem-medium.tar.bz2 | tar xj
npm run audio:tts
```

### Variables d’environnement (facultatives)

Voir `.env.example` :

- `VITE_AUDIO_BASE_URL` — servir les fichiers audio depuis un CDN (défaut : `audio/` à côté de l’application) ;
- `VITE_QURAN_WBW_URL` — source distante de l’audio mot-à-mot du Coran (vide = désactivée).

## Vue Mushaf (composant réutilisable)

```tsx
import { MushafView } from '@/features/mushaf/MushafView';

// Al-Ikhlâs avec la qalqala mise en évidence
<MushafView surah={112} highlight={{ rules: ['qalaqah'] }} />

// Al-Fâtiha, versets 1 à 4, lettre lâm mise en évidence, autres mots atténués
<MushafView surah={1} from={1} to={4} highlight={{ letters: ['ل'] }} dimOthers />

// Plusieurs signes à la fois (tanwîn)
<MushafView surah={114} highlight={{ marks: ['ً', 'ٌ', 'ٍ'], label: 'le tanwîn' }} />
```

| Prop | Rôle |
| --- | --- |
| `surah`, `from`, `to` | Sourate et plage de versets |
| `highlight` | Élément étudié : `letters` (toutes les variantes, ex. ا → أ إ آ ٱ), `marks` (voyelles, soukoun, chadda…), `rules` (19 règles de Tajweed) |
| `dimOthers` | Atténue les mots qui ne contiennent pas l’élément |
| `foundKeys` | Mots déjà trouvés (exercices de chasse) |
| `tajweed` | Force l’affichage ou non des couleurs (sinon : réglage utilisateur) |
| `onWordPress` | Rappel au clic sur un mot (le mot est déjà prononcé automatiquement) |

La page `/mushaf` accepte aussi ces paramètres dans l’URL : `/mushaf?s=1&l=ب`, `/mushaf?s=112&r=qalaqah`, `/mushaf?s=114&m=sukun`.

## Déploiement

Le build est un site statique (`dist/`) :

- **Vercel** : `vercel.json` inclus (réécriture SPA).
- **Netlify** : `public/_redirects` inclus.
- **Autre hébergeur** : servir `dist/` en redirigeant les routes inconnues vers `index.html`.

## Données, polices et licences

- **Police coranique** : *KFGQPC HAFS Uthmanic Script* © King Fahd Glorious Quran Printing Complex — distribution et utilisation gratuites autorisées, sans modification (`public/fonts/UthmanicHafs1Ver18.woff2`).
  Dans cette police, le yâ’ final s’écrit sans points (convention du Mushaf de Médine) : pour présenter la lettre seule aux débutants, ce seul glyphe est emprunté à *Amiri Quran* (SIL Open Font License, `public/fonts/AMIRI-OFL.txt`).
- **Texte coranique et Tajweed** : texte uthmani Hafs de Quran.com (`text_uthmani_tajweed`), pré-segmenté par le paquet MIT [`react-native-quran-tajweed`](https://www.npmjs.com/package/react-native-quran-tajweed). Pour régénérer `src/data/quran/surahs/` :

  ```bash
  npm pack react-native-quran-tajweed@0.1.3 && tar xzf react-native-quran-tajweed-0.1.3.tgz
  npm run quran:build -- package/src/data
  ```
- **Audio mot-à-mot** (en ligne) : Quran.com.
- **Sons intégrés** : synthèse vocale hors ligne avec [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) (Apache 2.0) et la voix Piper « ar_JO-kareem-medium ». La carte du modèle renvoie à son jeu de données d’entraînement sans préciser de licence : à vérifier avant une diffusion à grande échelle, ou à remplacer par vos enregistrements.
- **Interface** : Manrope et Fraunces (SIL OFL), icônes Lucide (ISC).
