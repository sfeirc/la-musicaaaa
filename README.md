# Générateur Musical GPT-4o 🎵

Une application Next.js qui transforme les descriptions en langage naturel en arrangements musicaux jouables grâce aux sorties structurées de GPT-4o. Fonctionnalités : lecture Web Audio en temps réel, visualisation piano roll, et capacités d'export.

![Générateur Musical GPT-4o](https://img.shields.io/badge/GPT--4o-G%C3%A9n%C3%A9rateur%20Musical-blue?style=for-the-badge&logo=openai)

## ✨ Fonctionnalités

- **🤖 Génération par IA**: GPT-4o avec sorties structurées crée des arrangements musicaux précis à partir du langage naturel
- **🎵 Lecture Temps Réel**: API Web Audio avec synthèse d'enveloppe ADSR et formes d'onde personnalisables
- **🎹 Piano Roll Visuel**: Piano roll interactif avec surlignage des notes en temps réel et tête de lecture
- **📤 Options d'Export**: Copiez les appels Python `play_frequency()` ou téléchargez les arrangements JSON
- **🎛️ Contrôles Audio**: Formes d'onde personnalisables (sinusoïdale, carrée, dent de scie, triangulaire) et enveloppe ADSR
- **✨ Interface Magnifique**: Interface moderne avec Tailwind CSS et animations Framer Motion

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ 
- Clé API OpenAI ([obtenez-en une ici](https://platform.openai.com/api-keys))

### Installation

1. **Clonez et installez les dépendances :**
   ```bash
   git clone https://github.com/sfeirc/la-musicaaaa.git
   cd la-musicaaaa
   npm install
   ```

2. **Ajoutez votre clé API OpenAI :**
   ```bash
   # Créez le fichier .env.local
   echo "OPENAI_API_KEY=sk-votre-cle-api-openai-ici" > .env.local
   ```

3. **Lancez le serveur de développement :**
   ```bash
   npm run dev
   ```

4. **Ouvrez [http://localhost:3000](http://localhost:3000)** dans votre navigateur

## 🎹 Comment Utiliser

1. **Saisissez une description musicale** comme :
   - "Riff style Seven Nation Army ~120 bpm en La mineur"
   - "Mélodie de Joyeux Anniversaire en Do majeur"  
   - "Riff simple en gamme blues Mi mineur"
   - "Mélodie de La Marseillaise en Sib majeur"

2. **Cliquez sur Générer** - GPT-4o crée un arrangement structuré avec des fréquences et durées précises

3. **Jouez & Visualisez** - Regardez la visualisation piano roll pendant que l'arrangement joue avec Web Audio

4. **Personnalisez l'Audio** - Ajustez la forme d'onde, l'enveloppe ADSR, et les paramètres de volume

5. **Exportez** - Copiez le code Python ou téléchargez le JSON pour vos projets

## 🛠️ Stack Technique

- **Framework**: Next.js 14 avec App Router
- **Langage**: TypeScript
- **Style**: Tailwind CSS avec effets premium
- **Animations**: Framer Motion
- **IA**: OpenAI GPT-4o avec Sorties Structurées
- **Audio**: API Web Audio
- **Validation**: Schémas Zod
- **Icônes**: Lucide React

## 📁 Project Structure

```
src/
├── app/
│   ├── api/arrange/route.ts    # GPT-4o API endpoint
│   ├── globals.css             # Global styles
│   └── page.tsx               # Main page component
├── components/
│   ├── AudioControls.tsx      # ADSR & waveform controls
│   ├── MusicPlayer.tsx        # Main player component
│   └── PianoRoll.tsx          # Visual piano roll
├── types/
│   └── music.ts               # TypeScript interfaces
└── utils/
    ├── audioEngine.ts         # Web Audio synthesis
    └── exportUtils.ts         # Export functionality
```

## 🎵 Exemples de Sorties

### Export Python
```python
# Riff style Seven Nation Army ~120 bpm en La mineur
# Tonalité: La mineur, Tempo: 120 BPM

def play_frequency(frequency, duration):
    # Votre implémentation audio ici
    pass

play_frequency(659.26, 0.20)  # Mi5
play_frequency(659.26, 0.20)  # Mi5  
play_frequency(659.26, 0.20)  # Mi5
play_frequency(622.25, 0.30)  # Ré#5
```

### Export JSON
```json
{
  "title": "Riff style Seven Nation Army",
  "tempo_bpm": 120,
  "key_signature": "La mineur",
  "notes": [
    {
      "frequency": 659.26,
      "duration": 0.2,
      "note_name": "Mi5"
    }
  ]
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional  
OPENAI_ORG_ID=org-your-org-id
```

### Audio Settings

- **Waveforms**: Sine, Square, Sawtooth, Triangle
- **ADSR Envelope**: Attack, Decay, Sustain, Release controls
- **Volume**: Master volume control
- **Presets**: Default, Pluck, Pad, Organ

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- OpenAI for GPT-4o and structured outputs
- Web Audio API for real-time synthesis
- Next.js team for the excellent framework