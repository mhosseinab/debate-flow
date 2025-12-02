# DebateFlow - Podcast Script Builder

> Transform any source text into professional podcast scripts with AI-powered dialogue generation and multi-speaker audio synthesis.

## 🎯 Overview

DebateFlow is a modern web application that leverages Google's Gemini AI to convert articles, essays, or notes into engaging podcast scripts. The platform supports multi-speaker dialogue generation, customizable voice profiles, and real-time audio synthesis using Google's Text-to-Speech API.

## ✨ Features

### Core Functionality
- **AI-Powered Script Generation**: Transform source text into natural, conversational podcast scripts
- **Multi-Speaker Dialogue**: Configure host and guest speakers with distinct voices and personalities
- **Real-Time Streaming**: Watch your script generate in real-time as the AI processes your input
- **Audio Synthesis**: Generate high-quality audio with multi-speaker voice synthesis
- **Configurable Production Settings**: Fine-tune every aspect of your podcast production

### Advanced Features
- **Show Notes Generation**: Automatically generate structured show notes with titles, summaries, and takeaways
- **Viral Clip Scripts**: Generate standalone 60-second hook clips optimized for social media
- **Critical Analysis Mode**: Enable AI to identify logical fallacies and gaps in source material
- **Custom Prompts**: Override default behavior with custom instructions
- **Debug Logging**: Inspect AI prompts and responses for transparency and troubleshooting
- **Multiple Languages**: Support for English, Spanish, French, German, Portuguese, Japanese, and Persian
- **Reader Mode**: Clean transcript view without action markers and separators

### Configuration Options
- **Duration**: 5, 15, 30, 45, or 60 minutes
- **Tone**: Neutral & Balanced, Heated Debate, Casual Banter, NPR Style, High Energy, Investigative
- **Format**: Standard Debate, Host & Guest Interview, Roundtable Discussion, Narrative Storytelling, Educational/Explainer
- **Pacing**: Relaxed, Conversational, Rapid-Fire
- **Speaker Balance**: Balanced (50/50), Host-Led (70/30), Guest-Star (30/70)
- **Sound Design**: Clean, Standard, Cinematic
- **Music Genres**: Lo-Fi/Chill, Corporate/Tech, Cinematic/Orchestral, Jazz/Lounge, Electronic/Upbeat
- **Vocabulary Levels**: Accessible, Sophisticated, Academic, Simplified (ESL)
- **Conclusion Styles**: Thought-Provoking Question, Direct Call to Action, Abrupt Fade Out, Summarizing Wrap-up

## 🛠 Tech Stack

### Frontend
- **React 19.2.0** - UI framework
- **TypeScript 5.8.2** - Type safety
- **Vite 6.2.0** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### AI & Backend Services
- **@google/genai 1.30.0** - Google Gemini AI SDK
- **@langchain/core 1.1.0** - LangChain core utilities
- **@langchain/google-genai 2.0.0** - LangChain Google Gemini integration

### Models Used
- **gemini-2.5-flash** - Text generation and script creation
- **gemini-2.5-flash-preview-tts** - Text-to-speech audio synthesis

## 📋 Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** or **yarn** package manager
- **Google Gemini API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd debate-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

   Alternatively, you can set the API key through the application's API modal on first launch.

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the production bundle:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 📖 Usage Guide

### Basic Workflow

1. **Input Source Text**
   - Paste your article, essay, or notes into the Source Text area
   - Use the "Magic Fill" button for example topics
   - Minimum 10 words required to generate

2. **Configure Settings** (Optional)
   - Switch to the "Config" tab in the sidebar
   - Customize podcast name, duration, tone, speakers, and more
   - Use the sparkle icon to auto-generate a podcast name from your script

3. **Generate Script**
   - Click "Generate Episode" button
   - Watch the script generate in real-time in the main viewer
   - The script will include dialogue, action markers, and optional show notes

4. **Generate Audio** (Optional)
   - Once the script is complete, click the microphone icon
   - Audio generation processes the script in chunks with progress tracking
   - Play, pause, and download the generated audio

### Advanced Features

#### Show Notes
Enable "Show Notes" in the Advanced section to generate:
- Episode title
- Summary
- Key takeaways

#### Viral Clip
Enable "Viral Clip" to append a 60-second standalone hook script optimized for social media sharing.

#### Critical Analysis
Enable "Critical Analysis" to have the AI actively identify:
- Logical fallacies
- Gaps in source material
- Unsupported claims

#### Custom Prompts
Add custom instructions in the "Custom Directions" section to override default behavior, e.g.:
```
Make the host very skeptical about AI claims. 
Have the guest provide counter-arguments with specific examples.
```

#### Debug Mode
Click the bug icon in the header to view:
- All AI prompts sent to the API
- Full responses received
- Error logs and status tracking

## 🏗 Project Structure

```
debate-flow/
├── components/          # React components
│   ├── modals/         # Modal dialogs (API, Debug)
│   ├── ui/             # Reusable UI components
│   ├── AudioPlayer.tsx
│   ├── ConfigurationPanel.tsx
│   ├── ScriptInput.tsx
│   └── TranscriptViewer.tsx
├── hooks/              # Custom React hooks
│   ├── useLocalStorage.ts
│   └── useLogger.ts
├── lib/                # Utility functions
│   ├── audioUtils.ts   # Audio processing utilities
│   └── utils.ts        # General utilities
├── services/           # Business logic
│   ├── gemini.ts       # Gemini AI integration
│   └── prompts.ts      # Prompt building system
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── types.ts            # TypeScript type definitions
├── constants.ts        # Configuration constants
└── vite.config.ts      # Vite configuration
```

## 🔧 Configuration

### Voice Profiles

The application includes 5 pre-configured voice profiles:

| Name    | Gender | Description           |
|---------|--------|-----------------------|
| Puck    | Male   | Deep, rough           |
| Charon  | Male   | Deep, authoritative   |
| Kore    | Female | Soft, calm            |
| Fenrir  | Male   | High energy           |
| Zephyr  | Female | Balanced, clear       |

### Default Configuration

- **Podcast Name**: "Mind Matters"
- **Duration**: 5 minutes
- **Tone**: Neutral & Balanced
- **Format**: Standard Debate (2 Sides)
- **Language**: English
- **Pacing**: Conversational (Default)
- **Speaker 1 (Host)**: Alex (Male, Puck voice)
- **Speaker 2 (Guest)**: Sarah (Female, Kore voice)
- **Balance**: Balanced (50/50)

All settings are persisted in browser local storage and restored on reload.

## 🔐 API Key Management

The application supports API key management in two ways:

1. **Environment Variable**: Set `GEMINI_API_KEY` in your `.env` file
2. **Runtime Configuration**: Enter the API key through the modal dialog on first launch

The API key is stored in memory during the session. For production deployments, use environment variables.

## 🐛 Debugging

### Debug Modal
Access the debug modal via the bug icon in the header to view:
- Request/Response logs for all AI calls
- Error messages and stack traces
- Prompt templates and generated prompts
- Response content and status

### Console Logging
The application logs detailed information to the browser console, including:
- Audio generation progress
- Chunk processing status
- Error details

## 🎨 UI/UX Features

- **Dark Theme**: Professional dark UI with lime accent color (#D0F224)
- **Real-Time Updates**: Live script generation with streaming responses
- **Responsive Design**: Optimized for desktop and tablet viewing
- **Keyboard Shortcuts**: Standard browser shortcuts supported
- **Copy to Clipboard**: One-click transcript copying
- **Text Export**: Download transcript as `.txt` file
- **Audio Export**: Download generated audio as WAV file

## ⚠️ Limitations & Considerations

1. **API Rate Limits**: Google Gemini API has rate limits. Very long scripts may require multiple API calls.
2. **Audio Generation**: Audio synthesis processes in chunks and may take several minutes for longer scripts.
3. **Browser Compatibility**: Requires modern browsers with Web Audio API support.
4. **Network Dependency**: All AI operations require an active internet connection.
5. **Token Limits**: Very long source texts may be truncated to fit model context windows.

## 🔄 Error Handling

The application includes comprehensive error handling:
- **API Failures**: Automatic retry with exponential backoff (up to 3 attempts)
- **Network Errors**: User-friendly error messages with recovery suggestions
- **Validation**: Input validation prevents invalid configurations
- **Graceful Degradation**: Partial failures don't crash the application

## 📝 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📧 Support

[Add support contact information here]

## 🙏 Acknowledgments

- Built with [Google Gemini AI](https://deepmind.google/technologies/gemini/)
- Powered by [LangChain](https://www.langchain.com/)
- UI inspired by modern podcast production tools

---

**Note**: This application requires a valid Google Gemini API key. Ensure you have sufficient API quota for your usage needs.

