# DebateFlow

Transform any source text into professional podcast scripts with AI-powered dialogue generation and multi-speaker audio synthesis using Google's Gemini AI.

## Features

- **AI Script Generation**: Convert articles, essays, or notes into natural podcast dialogues
- **Multi-Speaker Support**: Configure host and guest with distinct voices (Puck, Charon, Kore, Fenrir, Zephyr)
- **Real-Time Streaming**: Watch scripts generate live as the AI processes your input
- **Audio Synthesis**: Generate high-quality multi-speaker audio using Google TTS
- **Customizable Production**: Control duration (5-60 min), tone, pacing, language, and more
- **Advanced Options**: Show notes, viral clip scripts, critical analysis mode, custom prompts
- **Debug Tools**: Inspect AI prompts and responses for transparency

## Prerequisites

- Node.js 18+ (recommended: 20+)
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

## Setup

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd debate-flow
   npm install
   ```

2. **Configure API key**
   
   Create a `.env` file in the root:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   
   Or enter it through the API modal on first launch.

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open `http://localhost:3000`

## Usage

### Basic Workflow

1. **Input Source Text**: Paste your content in the Source tab (minimum 10 words)
2. **Configure Settings** (optional): Switch to Config tab to customize:
   - Podcast name, duration (5/15/30/45/60 min)
   - Tone (Neutral, Heated Debate, Casual, NPR Style, etc.)
   - Speakers (names, genders, voices)
   - Language, pacing, balance, and more
3. **Generate Script**: Click "Generate Episode" and watch it stream in real-time
4. **Generate Audio**: Click the microphone icon to synthesize audio (processes in chunks)

### Advanced Features

- **Show Notes**: Enable to auto-generate episode title, summary, and takeaways
- **Viral Clip**: Generate a 60-second standalone hook script for social media
- **Critical Analysis**: Have AI identify logical fallacies and gaps in source material
- **Custom Prompts**: Override default behavior with custom instructions
- **Debug Mode**: Click bug icon to view all AI prompts and responses

## Configuration

### Voice Profiles

| Name   | Gender | Description           |
|--------|--------|-----------------------|
| Puck   | Male   | Deep, rough           |
| Charon | Male   | Deep, authoritative   |
| Kore   | Female | Soft, calm            |
| Fenrir | Male   | High energy           |
| Zephyr | Female | Balanced, clear       |

### Supported Languages

English, Spanish, French, German, Portuguese, Japanese, Persian

## Project Structure

```
debate-flow/
├── components/       # React components (UI, modals, viewers)
├── hooks/           # Custom hooks (localStorage, logger)
├── lib/             # Utilities (audio, text processing)
├── services/        # AI integration (Gemini, prompts)
├── App.tsx          # Main application
└── types.ts         # TypeScript definitions
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **AI**: Google Gemini 2.5 Flash (text), Gemini 2.5 Flash TTS (audio)
- **Orchestration**: LangChain
- **Icons**: Lucide React

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Notes

- API key can be set via `.env` file or runtime modal
- Audio generation processes in chunks and may take several minutes for longer scripts
- Requires modern browser with Web Audio API support
- All AI operations require active internet connection

## Troubleshooting

- **API Key Missing**: Set `GEMINI_API_KEY` in `.env` or use the API modal
- **Audio Generation Fails**: Try shorter scripts or different tone settings
- **Script Not Generating**: Check browser console for errors, verify API key is valid
- **Debug Issues**: Use the debug modal (bug icon) to inspect prompts and responses
