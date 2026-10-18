# Carte de visite Zynto

Carte de visite numérique de **Zoniaina Rémi ANDRIAHENINTSOA** (Zynto), hébergée sur GitHub Pages.

- **Front office** : `index.html`, la carte publique (emails, téléphones, WhatsApp, ajout aux contacts en .vcf, QR code, partage).
- **Back office** : `admin.html`, le formulaire d'édition avec aperçu en direct. Chaque enregistrement fait un commit sur `data/card.json` (et `data/photo.jpg`) via l'API GitHub.

Site 100 % statique : HTML, CSS et JavaScript, sans build ni serveur.

## Structure

```
index.html        Front office
admin.html        Back office
assets/style.css  Styles (palette Zynto, thème clair/sombre)
assets/card.js    Rendu de la carte, vCard, QR code (partagé)
assets/app.js     Logique du front office
assets/admin.js   Logique du back office (API GitHub Contents)
assets/logo.svg   Logo Z
data/card.json    Données de la carte
data/photo.jpg    Photo (créée au premier envoi depuis le back office)
```

## Utiliser le back office

1. Créer un jeton fine-grained : GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**.
   - *Repository access* : uniquement ce dépôt.
   - *Permissions* : **Contents : Read and write**.
2. Ouvrir `https://<utilisateur>.github.io/<dépôt>/admin.html`, coller le jeton et se connecter.
3. Modifier, puis **Enregistrer**. GitHub Pages republie la carte en une minute environ.

Le jeton reste dans le navigateur (session, ou appareil si « Rester connecté » est coché). Il n'est jamais écrit dans le dépôt.
Sans jeton valide, `admin.html` ne peut rien modifier.

## Lancer en local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```
