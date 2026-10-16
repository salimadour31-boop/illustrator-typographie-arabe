# Typographie arabe — script Adobe Illustrator

**TypographieArabe.jsx** v1.0.0 — corrige en une passe les fautes de composition du texte arabe dans Illustrator, selon le contexte et sans toucher à la mise en forme.
*One-pass, context-aware Arabic typography clean-up for Illustrator that keeps formatting (FR/EN dialog).*

## Ce que fait le script

Le texte arabe envoyé par les clients (Word, WhatsApp, e-mail, sites Web) arrive souvent avec des fautes de saisie. Le script les corrige dans les blocs de texte (sélection, calque actif ou document) :

**Ponctuation** (seulement à côté de l'arabe) :
- `,` `;` `?` latins → `،` `؛` `؟` ; `،،` → `،`. Les nombres décimaux (3,5 ou ٣,٥), les URL, les e-mails et la ponctuation qui suit un mot latin ne sont pas touchés. Exemples : `في 2024, كان` → `في 2024، كان`, mais `زرت Paris, France` reste tel quel ;
- espaces supprimées avant la ponctuation et à l'intérieur des `( )` `[ ]` `« »` : `بخير ?` → `بخير؟`, `( نص )` → `(نص)` ;
- espace manquante ajoutée après `، ؛ ؟ ! : .` et autour des parenthèses : `انتهى.بدأ` → `انتهى. بدأ`, `كلمة(نص)كلمة` → `كلمة (نص) كلمة`. Les abréviations d'une lettre (`د.محمد`, `ص.ب`) et les heures (`10:30`) restent intactes ;
- en option : `؟؟؟` et `!!!` réduits à un seul signe, guillemets droits `"…"` autour de l'arabe → `« … »`.

**Espaces et mots** :
- espaces doubles, espaces en début et en fin de paragraphe (les tabulations sont gardées) ;
- conjonction `و` détachée recollée au mot suivant : `الكتاب و القلم` → `الكتاب والقلم` (pas entre deux nombres : `5 و 6` reste).

**Lettres et caractères** :
- lettres d'un clavier persan ou ourdou → lettres arabes : `ک` → `ك`, `ہ ھ` → `ه`, `ی` → `ي` quand elle est liée à la lettre suivante et `ى` en fin de mot (l'aspect reste le même : `علی` → `على`). Les paragraphes qui contiennent des lettres propres au persan ou à l'ourdou (`پ چ ژ گ ٹ ڈ ڑ ں ے`) sont laissés tels quels ;
- caractères de contrôle invisibles collés depuis le Web ou Word (LRM, RLM, ALM, ZWSP, BOM, incorporations et isolats bidi) qui dérèglent le sens du texte. ZWJ et ZWNJ sont gardés ;
- en option : tatwīl `ـ` tapés à la main à l'intérieur des mots (pas celui qui sert de tiret entre deux nombres), voyelles (tachkīl).

**Chiffres** (option) : conversion du *contenu* des nombres dans le texte arabe, vers les chiffres occidentaux `0123` (usage du Maghreb) ou orientaux `٠١٢٣` (Machrek), avec le séparateur décimal (`٫` ↔ `,` ou `.`), les milliers `٬` et `٪`. Vers les chiffres orientaux, les nombres collés à un mot latin (`A4`, `COVID-19`), les URL et les e-mails ne sont pas convertis.

Les paragraphes sans lettre arabe ne sont **jamais** modifiés : un document bilingue français / arabe peut être traité en entier. Chaque caractère modifié garde ses attributs (police, corps, couleur, style). Les blocs liés sont traités une seule fois ; les objets verrouillés ou masqués et ceux des calques verrouillés ou masqués sont ignorés.

Boutons : **Analyser** (compte les corrections par règle et montre des exemples avant → après, sans rien modifier), **Sélectionner les textes à corriger**, **Appliquer**. Les réglages sont mémorisés dans un petit fichier local (`TypographieArabe.cfg` dans le dossier des données utilisateur). Aucun appel réseau, aucune collecte de données.

Différence avec les autres scripts du même auteur : [ReparerTexteArabeRTL](https://github.com/salimadour31-boop/illustrator-texte-arabe-rtl) règle le composeur, le sens des paragraphes, l'affichage des chiffres (attribut) et le texte collé depuis un PDF ; [TypographieFrancaise](https://github.com/salimadour31-boop/illustrator-typographie-francaise) applique les règles françaises. TypographieArabe corrige l'orthotypographie du texte arabe lui-même (ponctuation, espaces, lettres, contenu des chiffres). Les trois peuvent être utilisés ensemble.

## Pourquoi c'est nouveau

Vérifié le 16 octobre 2026 :

- **Illustrator** n'a ni GREP ni correcteur typographique arabe. Rechercher / Remplacer ne remplace qu'un caractère à la fois, sans contexte : remplacer toutes les `,` par `،` casserait le texte français et les nombres d'un document bilingue.
- **Adobe Community** : les réponses aux problèmes de ponctuation arabe dans Illustrator se limitent aux réglages du composeur et du sens ; pour la virgule arabe, la seule méthode contextuelle citée est une requête GREP… d'InDesign (« Illustrator supports Find and Replace, but its documentation does not show GREP; use a script or manually »).
- **GitHub** : aucun script Illustrator ou InDesign trouvé (recherches « arabic punctuation », « arabic typography indesign », « arabic illustrator script », « arabic text cleaner »). Les dépôts existants sont des modèles de prédiction de ponctuation (AraBERT…) et des nettoyeurs Python de texte brut pour le TAL, hors d'Illustrator.
- **Outils en ligne** (wordsarabic.com « ضبط ومعايرة النصوص العربية », adawati.life, arabtoolbox, RTLY-Kit en PHP) : ils traitent du texte brut copié-collé, perdent la mise en forme, ne savent pas laisser intact le français d'un même document et normalisent parfois l'orthographe de façon destructive (أ إ آ → ا, ة → ه).
- Les catalogues de scripts connus (creold, Hiroyuki Sato, John Wundes, Alexander Ladygin, wckdtall, Kelso Cartography) ne proposent rien sur le texte arabe.

Idées vérifiées et écartées pendant la même recherche car elles existent déjà : inversion d'une mise en page pour la version arabe (Astute Graphics QuickOps « Text-Aware Reflect » + astuce native Transformation individuelle ; plug-ins Figma « RTL Mirror »), gabarit de couverture avec dos (générateurs KDP / BooksOasis, script InDesign de yourscriptdoctor), risque de bandes dans les dégradés (グラデーションチェッカー de ten-artai), points de conduite des menus (tabulations natives avec points de suite), œillets de bâches (Mars Premedia Grommet Marks, O2 Creative Hem & Grommet PowerScript, illustrator-grommet-marks.jsx).

## Installation

- **Ponctuelle** : Fichier > Scripts > Autre script…, puis choisir `TypographieArabe.jsx`.
- **Permanente** : copier le fichier dans le dossier `Presets/<langue>/Scripts` d'Illustrator (par exemple `Adobe Illustrator 2026/Presets/fr_FR/Scripts`), puis redémarrer Illustrator. Le script apparaît dans Fichier > Scripts.

## Utilisation

1. Ouvrez une **copie** de votre document (recommandé).
2. Sélectionnez des blocs de texte (ou du texte avec l'outil Texte), ou choisissez Calque actif / Document dans le dialogue.
3. Lancez le script, cochez les règles voulues, cliquez sur **Analyser** pour voir le nombre de corrections et des exemples.
4. Cliquez sur **Appliquer**. Édition > Annuler (Ctrl+Z / Cmd+Z) revient en arrière.

Si aucun document n'est ouvert, ou si rien n'est sélectionné avec la portée Sélection, le script l'indique et s'arrête.

## Version cible et statut des tests

- Cible : Adobe Illustrator CC 2018 et plus récent (ExtendScript, Windows et macOS).
- **Non testé dans Illustrator.**
- Syntaxe vérifiée avec acorn en mode ES3 (mots réservés interdits) et ES5.
- Règles texte vérifiées sur données simulées : `node tests/test-core.js` (77 tests : ponctuation, espaces, و, lettres persanes, contrôles, chiffres, guillemets, paragraphes français intacts, et 3 000 textes aléatoires : aucune exception, paragraphes sans arabe jamais modifiés, second passage sans changement).
- Application vérifiée sur objets Illustrator simulés : `node tests/test-simulation.js` (28 tests : portée, objets verrouillés / masqués, blocs liés, attributs des caractères conservés, arrêt de sécurité, dialogue, sélection, messages). Ces simulations ne remplacent pas un essai réel.

Limites : un court texte persan sans lettre propre au persan serait converti par la règle « clavier persan » (décochez-la pour du persan) ; un texte dont les caractères ne peuvent pas être indexés un par un est ignoré et compté dans le résumé ; si Illustrator ne donne pas le résultat attendu, le texte concerné est arrêté par sécurité.

## Licence

MIT © 2026 Amirouche Amwanes — voir [LICENSE](LICENSE).
