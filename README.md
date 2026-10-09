# Iqra — Apprendre à lire l’arabe, jusqu’au Mushaf

**Iqra** (ٱقْرَأْ, « Lis ! ») est une application web **100 % gratuite**, au design premium, pour apprendre à lire l’arabe : des lettres isolées jusqu’à la lecture du Coran mot à mot, avec le code couleur du Tajweed.

- **Carte de progression** interactive façon Duolingo : 8 étapes, 49 leçons, déverrouillage progressif.
- **Apprentissage par l’écoute** (aucun micro, aucune reconnaissance vocale) : chaque lettre, syllabe et mot se touche pour être entendu, avec une animation d’onde synchronisée. **Uniquement des voix humaines** : récitation mot-à-mot de Quran.com pour le Coran, vos enregistrements pour les lettres — jamais de voix de synthèse.
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
| `npm run quran:build` | Régénère les données coraniques (voir plus bas) |
| `npm run quran:words` | Relie le vocabulaire des leçons à sa récitation dans le Coran |

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
│   ├── engine.ts               Moteur audio (enregistrement local → récitation Quran.com)
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
│   │   ├── modules.ts          Les 8 étapes et leurs leçons
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

La structure suit la méthode **« Ata‘allamu al-‘arabiyya »** (أتعلم العربية) de Cheikh Ayyoub (La Madrassah) :

1. **Comprendre d’abord le système** plutôt que d’apprendre l’alphabet par cœur : une lettre + une voyelle = un son, le soukoun, les voyelles longues (ا و ي).
2. **Une lettre par leçon**, comme dans le livre : la lettre et son mot-clé, la lettre avec chaque voyelle (puis le tanwîn), voyelle courte / voyelle longue, des mots qui n’utilisent **que des lettres déjà étudiées** (vérifié par les tests), sa forme selon sa place dans le mot (seule, début, milieu, fin).
3. **Les notions se glissent en chemin**, dès que les lettres nécessaires sont connues : tanwîn, lettres qui ne s’attachent pas, lîn (aw, ay), لا, chadda, tâ’ marbûṭa, hamza, alif maqsûra, lettres solaires et lunaires, alif de liaison…
4. **Chaque nouvelle lettre se cherche dans le Mushaf**, pour se familiariser tout de suite avec la lecture du Coran.

| Étape | Contenu |
| --- | --- |
| 1. Comment se lit l’arabe | Lettre + voyelle = son, soukoun, voyelles longues, première lettre ب et l’écriture attachée |
| 2. La famille du bâ’ | ت ث ن ي (et le son « ay »), le tanwîn, révision « les points font la différence » |
| 3. Les lettres qui ne s’attachent pas | ر د و (et le son « aw ») ز ذ, révision attachée / pas attachée |
| 4. Les lettres fréquentes | م ل (et لا), la chadda, ك ه, le tâ’ marbûṭa ة, س ش |
| 5. La gorge et la hamza | ق ج ح خ, la hamza, l’alif maqsûra ى |
| 6. Le soleil et la lune | L’article (lettres lunaires / solaires), ف, l’alif de liaison ٱ |
| 7. Les dernières lettres | ع غ ص ض ط ظ, les lettres épaisses, la qalqala |
| 8. Lire le Mushaf | Les petites lettres du Mushaf (ـٰ ۥ ۦ), lecture de phrases, Al-Fâtiha, Al-Ikhlâs, Al-Falaq, An-Nâs, couleurs du Tajweed |

L’ordre exact des lettres du livre n’étant pas reproduit ici, il est défini en une ligne (`LETTER_ORDER` dans `src/data/curriculum/modules.ts`) avec les mots de chaque leçon dans `words.ts` : on peut l’aligner sur le sommaire du livre sans toucher au reste.

Chaque leçon combine plusieurs types d’exercices : présentation, fiche de lettre, découverte (écouter chaque élément), QCM auditif, QCM visuel, association de paires, « écoute et répète » avec lecture guidée (surlignage karaoké), assemblage de syllabes, tableau des formes, chasse dans le Mushaf, lecture d’un verset, « quel mot as-tu entendu ? », remise en ordre d’un verset.
Une question ratée revient automatiquement en fin de leçon.

**Adapter le contenu** : tout le parcours est décrit en données dans `src/data/curriculum/` (modules, mots, textes). Ajouter une leçon revient à appeler un des modèles (`letterLesson`, `wordsLesson`, `surahLesson`…) ou à écrire ses étapes avec les fabriques de `builders.ts`. Les tests (`npm test`) vérifient la cohérence de chaque leçon (bonne réponse présente, options uniques, syllabes qui recomposent le mot…).

## Audio : uniquement des voix humaines

Une prononciation approximative fait plus de mal que de bien à un apprenant : l’application **n’utilise aucune voix de synthèse**. Chaque élément cliquable est lu, dans l’ordre :

1. par **votre enregistrement** `public/audio/<chemin>` s’il existe ;
2. pour les mots du Coran, par la **récitation mot-à-mot de Quran.com** (connexion requise) — c’est aussi le cas de **189 mots de vocabulaire** des leçons qui figurent tels quels dans le Coran (`src/data/curriculum/quranWordAudio.json`, généré par `npm run quran:words`) ;
3. sinon, l’élément reste **silencieux** : seule l’animation est jouée, et un message l’explique une fois.

La récitation en ligne fonctionne sur le site publié (voir « Déploiement ») ; elle est bloquée dans les aperçus intégrés qui interdisent l’audio externe.

**Enregistrements inclus** (141 fichiers, dans `public/audio/`) : le **nom des 28 lettres**, chaque lettre avec **fatha, kasra et damma** (84 syllabes) et les **mots-clés** des leçons, issus du dépôt [bubblesinarabic/alphabets-audio](https://github.com/bubblesinarabic/alphabets-audio) (silences coupés, volume harmonisé). Restent à enregistrer : voyelles longues, soukoun, tanwîn, chadda et les mots absents du Coran (`docs/audio-attendus.txt`).

### Studio d’enregistrement (pour enseignant)

Les sons encore muets (voyelles longues, soukoun, tanwîn, chadda, mots absents du Coran : 376 aujourd’hui) n’existent dans aucune source libre. Le **Studio** (`/studio`, accessible depuis le Profil ou depuis l’avertissement « Pas encore d’enregistrement ») permet de les enregistrer au micro, un par un :

- carte guidée : texte arabe en grand, translittération, consigne (« allonge sur deux temps »…), bouton micro (ou touche Espace), réécoute, passage automatique au son suivant ;
- silences coupés et volume harmonisé dans le navigateur ; les enregistrements sont **joués aussitôt sur cet appareil** (stockés localement) ;
- **Exporter (.zip)** produit un fichier aux bons noms ; **Importer** recharge l’export d’un enseignant sur un autre appareil ;
- pour les publier pour tout le monde : `npm run audio:import -- iqra-enregistrements-AAAA-MM-JJ.zip` (conversion MP3 avec ffmpeg, manifeste régénéré), puis commit.

Les apprenants n’ont jamais besoin du micro : le Studio sert uniquement à créer les voix.

### Ajouter des enregistrements à la main

1. `npm run audio:list` écrit dans `docs/audio-attendus.txt` la liste des sons utilisés, avec le texte arabe à enregistrer.
2. Déposez les fichiers dans `public/audio/` en respectant les chemins :

| Dossier | Contenu | Exemple |
| --- | --- | --- |
| `letters/` | Nom de chaque lettre | `letters/ba.mp3` → « bâ’ » |
| `syllables/` | Syllabes (clé = lettre + signes) | `syllables/ba-fatha.mp3` → « ba », `syllables/ba-fatha_alif-plain.mp3` → « bâ » |
| `words/` | Mots de vocabulaire | `words/kataba.mp3` → كَتَبَ |
| `quran/wbw/` | Mots du Coran (même nommage que Quran.com, utile hors ligne) | `quran/wbw/001_002_003.mp3` → sourate 1, verset 2, mot 3 |

3. Lancez `npm run audio:manifest` (fait automatiquement par `npm run dev` et `npm run build`). Chaque fichier déposé est prioritaire.

Les formats `.mp3`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.wav` et `.webm` sont reconnus.

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

### GitHub Pages (inclus)

Le workflow `.github/workflows/pages.yml` teste et construit le site à chaque pull request, puis le **publie automatiquement à chaque mise à jour de `main`**. Une seule action manuelle, la première fois :

1. Dans le dépôt GitHub : **Settings → Pages → Build and deployment → Source : « GitHub Actions »**.
2. Fusionner la pull request dans `main` (ou lancer le workflow à la main depuis l’onglet **Actions**).

Le site est alors en ligne à l’adresse `https://<compte>.github.io/<dépôt>/` (ici : `https://ismal03.github.io/Adab-Quest/`). Le build « portable » utilise des chemins relatifs et un routage par `#`, il fonctionne donc dans ce sous-dossier sans configuration.

### Autres hébergeurs

Le build standard (`npm run build` → `dist/`) est un site statique :

- **Vercel** : `vercel.json` inclus (réécriture SPA).
- **Netlify** : `public/_redirects` inclus.
- **Autre hébergeur** : servir `dist/` en redirigeant les routes inconnues vers `index.html`, ou utiliser `npm run build:portable`.

## Données, polices et licences

- **Police coranique** : *KFGQPC HAFS Uthmanic Script* © King Fahd Glorious Quran Printing Complex — distribution et utilisation gratuites autorisées, sans modification (`public/fonts/UthmanicHafs1Ver18.woff2`).
  Dans cette police, le yâ’ final s’écrit sans points (convention du Mushaf de Médine) : pour présenter la lettre seule aux débutants, ce seul glyphe est emprunté à *Amiri Quran* (SIL Open Font License, `public/fonts/AMIRI-OFL.txt`).
- **Texte coranique et Tajweed** : texte uthmani Hafs de Quran.com (`text_uthmani_tajweed`), pré-segmenté par le paquet MIT [`react-native-quran-tajweed`](https://www.npmjs.com/package/react-native-quran-tajweed). Pour régénérer `src/data/quran/surahs/` :

  ```bash
  npm pack react-native-quran-tajweed@0.1.3 && tar xzf react-native-quran-tajweed-0.1.3.tgz
  npm run quran:build -- package/src/data
  ```
- **Récitation mot-à-mot** : Quran.com (chargée en ligne, non redistribuée dans le dépôt).
- **Lettres, syllabes et mots-clés** (`public/audio/letters`, `syllables`, `words/kw-*`, `words/tin`, `words/bayt`) : enregistrements de [Bubbles in Arabic](https://github.com/bubblesinarabic/alphabets-audio). Ce dépôt ne précise pas de licence : les droits restent à son auteur, dont l’autorisation doit être demandée pour une diffusion publique. Pour les retirer, il suffit de supprimer ces fichiers puis de lancer `npm run audio:manifest`.
- **Interface** : Manrope et Fraunces (SIL OFL), icônes Lucide (ISC).
