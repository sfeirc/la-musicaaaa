# GPT-4o Music Generator 🎵

A Next.js application that transforms natural language descriptions into playable musical arrangements using GPT-4o's structured outputs. Features real-time Web Audio playback, piano roll visualization, and export capabilities.

![GPT-4o Music Generator](https://img.shields.io/badge/GPT--4o-Music%20Generator-blue?style=for-the-badge&logo=openai)

## ✨ Features

- **AI-Powered Generation**: GPT-4o with structured outputs creates precise musical arrangements from natural language
- **Real-time Playback**: Web Audio API with ADSR envelope synthesis and customizable waveforms  
- **Visual Piano Roll**: Interactive piano roll with real-time note highlighting and playhead
- **Export Options**: Copy Python `play_frequency()` calls or download JSON arrangements
- **Audio Controls**: Customizable waveforms (sine, square, sawtooth, triangle) and ADSR envelope
- **Beautiful UI**: Modern interface with Tailwind CSS and Framer Motion animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/sfeirc/la-musicaaaa.git
   cd la-musicaaaa
   npm install
   ```

2. **Add your OpenAI API key:**
   ```bash
   # Create .env.local file
   echo "OPENAI_API_KEY=sk-your-openai-api-key-here" > .env.local
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🎹 How to Use

1. **Enter a musical prompt** like:
   - "Seven Nation Army-style riff ~120 bpm in A minor"
   - "Happy birthday melody in C major"  
   - "Simple blues scale riff in E minor"

2. **Click Generate** - GPT-4o creates a structured arrangement with precise frequencies and durations

3. **Play & Visualize** - Watch the piano roll visualization while the arrangement plays with Web Audio

4. **Customize Audio** - Adjust waveform, ADSR envelope, and volume settings

5. **Export** - Copy Python code or download JSON for use in your projects

## 🛠️ Technical Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **AI**: OpenAI GPT-4o with Structured Outputs
- **Audio**: Web Audio API
- **Validation**: Zod schemas
- **Icons**: Lucide React

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

## 🎵 Example Outputs

### Python Export
```python
# Seven Nation Army-style riff ~120 bpm in A minor
# Key: A minor, Tempo: 120 BPM

def play_frequency(frequency, duration):
    # Your audio implementation here
    pass

play_frequency(659.26, 0.20)  # E5
play_frequency(659.26, 0.20)  # E5  
play_frequency(659.26, 0.20)  # E5
play_frequency(622.25, 0.30)  # D#5
```

### JSON Export
```json
{
  "title": "Seven Nation Army-style riff",
  "tempo_bpm": 120,
  "key_signature": "A minor",
  "notes": [
    {
      "frequency": 659.26,
      "duration": 0.2,
      "note_name": "E5"
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