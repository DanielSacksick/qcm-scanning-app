# QCM Scanner — Correction automatique par IA

Application web de correction automatique de QCM (questionnaires à choix multiples) utilisant l'IA Vision pour extraire les questions et détecter les réponses des étudiants.

## Fonctionnalités

- **Import de copies** : Glissez-déposez vos copies scannées (PDF, JPG, PNG)
- **Extraction IA** : Analyse automatique des questions et détection des réponses via des modèles de vision (Qwen2.5-VL, DeepSeek-VL2, GLM-4.5V via OpenRouter)
- **Vérification** : Interface de relecture pour corriger les erreurs de détection
- **Barème** : Définition des bonnes réponses par le professeur
- **Correction automatique** : Notation instantanée de toutes les copies
- **Export Excel** : Téléchargement des résultats au format .xlsx

## Stack technique

- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Zustand (gestion d'état)
- OpenRouter API (modèles de vision IA)
- xlsx (export Excel)

## Installation locale

```bash
# Cloner le projet
git clone <your-repo-url>
cd qcm-scanning-app

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditez .env.local et ajoutez votre clé API OpenRouter

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Clé API OpenRouter ([obtenir ici](https://openrouter.ai/keys)) |

## Connexion

- **Identifiant** : `prof`
- **Mot de passe** : `qcm2025`

## Déploiement sur Vercel

1. Poussez le code sur GitHub
2. Importez le projet sur [vercel.com](https://vercel.com)
3. Ajoutez la variable d'environnement `OPENROUTER_API_KEY` dans les paramètres du projet
4. Déployez !

Le projet est prêt pour Vercel sans configuration supplémentaire.

## Modèles IA utilisés (via OpenRouter)

L'application essaie les modèles suivants dans l'ordre :

1. **Qwen2.5-VL-72B-Instruct** — Leader en DocVQA et OCR
2. **DeepSeek-VL2** — Excellent en OCR et DocVQA
3. **GLM-4.5V** — Bon en reconnaissance manuscrite

Si un modèle échoue, le suivant est automatiquement essayé.
