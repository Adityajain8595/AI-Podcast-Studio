import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { createClient } from '@supabase/supabase-js';
import logoImage from './assets/image.png';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials! Check your .env file");
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

// Credit constants
const DAILY_CREDIT_LIMIT = 3;

// --- Complete Localization ---
const translations = {
    en: {
        appTitle: "Podcast Studio",
        tagline: "AI-Powered Podcast Generator",
        home: "Home",
        yourPodcasts: "Your Podcasts",
        logout: "Logout",
        topicLabel: "What should today's episode be about?",
        topicPlaceholder: "e.g., The mysteries of DB Cooper, Future of Quantum Computing, Climate Change Solutions...",
        generateButton: "Generate Podcast",
        generating: "Crafting Your Episode",
        audioPlayer: "Now Playing",
        transcript: "Full Transcript",
        download: "Download Audio",
        newPodcast: "Create New Podcast",
        creditsLeft: "Credits Left",
        usedToday: "used today",
        resetsAt: "Resets at midnight",
        dailyLimitReached: "Daily Limit Reached",
        outOfCredits: "You have used all {limit} free credits for today.",
        creditsReset: "Credits reset at midnight. Please return tomorrow for more generations.",
        switchAccount: "Switch Account",
        tryThese: "Try these topics:",
        documentation: "Documentation",
        architecture: "System Architecture",
        workflowDiagram: "Generation Workflow",
        apiEndpoints: "API Endpoints",
        techStack: "Technology Stack",
        thinkingProcess: "Generation Log",
        showLogs: "Show Generation Logs",
        hideLogs: "Hide Generation Logs",
        noPodcasts: "No podcasts yet. Generate your first podcast!",
        delete: "Delete",
        play: "Play",
        loading: "Loading...",
        errors: {
            connection: "Unable to connect to the backend server. Please ensure the server is running.",
            generation: "Failed to generate podcast. Please try again.",
            backendOffline: "Backend server is offline. Please wait for it to wake up or contact support."
        },
        status: {
            checking: "Checking backend connection...",
            connected: "Backend connected",
            disconnected: "Backend disconnected",
            waking: "Waking up backend server..."
        }
    },
    hi: {
        appTitle: "पॉडकास्ट स्टूडियो",
        tagline: "एआई-संचालित पॉडकास्ट जनरेटर",
        home: "होम",
        yourPodcasts: "आपके पॉडकास्ट",
        logout: "लॉगआउट",
        topicLabel: "आज का एपिसोड किस बारे में होना चाहिए?",
        topicPlaceholder: "जैसे, डीबी कूपर का रहस्य, क्वांटम कंप्यूटिंग का भविष्य, जलवायु परिवर्तन समाधान...",
        generateButton: "पॉडकास्ट बनाएं",
        generating: "एपिसोड तैयार किया जा रहा है",
        audioPlayer: "अभी चल रहा है",
        transcript: "पूरी प्रतिलिपि",
        download: "ऑडियो डाउनलोड करें",
        newPodcast: "नया पॉडकास्ट बनाएं",
        creditsLeft: "क्रेडिट शेष",
        usedToday: "आज उपयोग किए गए",
        resetsAt: "मध्यरात्रि में रीसेट होता है",
        dailyLimitReached: "दैनिक सीमा समाप्त",
        outOfCredits: "आपने आज की सभी {limit} मुफ्त क्रेडिट का उपयोग कर लिया है।",
        creditsReset: "क्रेडिट मध्यरात्रि में रीसेट होते हैं। कृपया कल फिर आएं।",
        switchAccount: "खाता बदलें",
        tryThese: "इन विषयों को आज़माएं:",
        documentation: "प्रलेखन",
        architecture: "सिस्टम आर्किटेक्चर",
        workflowDiagram: "जनरेशन वर्कफ़्लो",
        apiEndpoints: "एपीआई एंडपॉइंट्स",
        techStack: "तकनीकी स्टैक",
        thinkingProcess: "जनरेशन लॉग",
        showLogs: "जनरेशन लॉग दिखाएं",
        hideLogs: "जनरेशन लॉग छिपाएं",
        noPodcasts: "अभी कोई पॉडकास्ट नहीं। अपना पहला पॉडकास्ट बनाएं!",
        delete: "हटाएं",
        play: "चलाएं",
        loading: "लोड हो रहा है...",
        errors: {
            connection: "बैकएंड सर्वर से कनेक्ट नहीं हो पा रहा है। कृपया सुनिश्चित करें कि सर्वर चल रहा है।",
            generation: "पॉडकास्ट बनाने में विफल। कृपया पुनः प्रयास करें।",
            backendOffline: "बैकएंड सर्वर ऑफलाइन है। कृपया इसके चालू होने तक प्रतीक्षा करें।"
        },
        status: {
            checking: "बैकएंड कनेक्शन की जांच हो रही है...",
            connected: "बैकएंड कनेक्टेड है",
            disconnected: "बैकएंड डिस्कनेक्टेड है",
            waking: "बैकएंड सर्वर जाग रहा है..."
        }
    }
};

// --- SVG Icons ---
const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" />
        <path d="M9 22V12H15V22" />
    </svg>
);

const PodcastIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2C10.6868 2 9.38642 2.25866 8.17317 2.7612C6.95991 3.26375 5.85752 4.00035 4.92893 4.92893C3.05357 6.8043 2 9.34784 2 12C2 14.6522 3.05357 17.1957 4.92893 19.0711C5.85752 19.9997 6.95991 20.7362 8.17317 21.2388C9.38642 21.7413 10.6868 22 12 22" />
        <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" />
        <path d="M12 12V17" />
        <path d="M16 14C16 14.5304 15.7893 15.0391 15.4142 15.4142C15.0391 15.7893 14.5304 16 14 16" />
        <path d="M8 14C8 14.5304 8.21071 15.0391 8.58579 15.4142C8.96086 15.7893 9.46957 16 10 16" />
        <circle cx="19" cy="19" r="3" />
        <path d="M21 21L23 23" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" />
        <path d="M16 17L21 12L16 7" />
        <path d="M21 12H9" />
    </svg>
);

const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 3L19 12L5 21V3Z" />
    </svg>
);

const PauseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </svg>
);

const RewindIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="19 19 11 12 19 5 19 19" />
        <polygon points="11 19 3 12 11 5 11 19" />
    </svg>
);

const ForwardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5 19 13 12 5 5 5 19" />
        <polygon points="13 19 21 12 13 5 13 19" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
    </svg>
);

const NewIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
        <circle cx="12" cy="12" r="10" />
    </svg>
);

const DeleteIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const DocumentationIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
        <path d="M8 15h4" />
    </svg>
);

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9L12 15L18 9" />
    </svg>
);

const ChevronUpIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 15L12 9L6 15" />
    </svg>
);

// --- Global Styles ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        * {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        .font-mono {
            font-family: 'JetBrains Mono', monospace !important;
        }
        
        body {
            background: #0a0118;
        }
        
        .thinking-process-scroll::-webkit-scrollbar {
            width: 4px;
        }
        
        .thinking-process-scroll::-webkit-scrollbar-track {
            background: rgba(168, 85, 247, 0.05);
            border-radius: 2px;
        }
        
        .thinking-process-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #a855f7 0%, #ec4899 100%);
            border-radius: 2px;
        }
        
        .transcript-scroll::-webkit-scrollbar {
            width: 4px;
        }
        
        .transcript-scroll::-webkit-scrollbar-track {
            background: rgba(168, 85, 247, 0.05);
        }
        
        .transcript-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #a855f7 0%, #ec4899 100%);
            border-radius: 2px;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
            animation: spin-slow 1s linear infinite;
        }
        
        @keyframes pulse-glow {
            0%, 100% { 
                box-shadow: 0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(236, 72, 153, 0.1);
            }
            50% { 
                box-shadow: 0 0 30px rgba(168, 85, 247, 0.5), 0 0 60px rgba(236, 72, 153, 0.2);
            }
        }
        
        .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
        }
        
        @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
            background-size: 200% 200%;
            animation: gradient-shift 8s ease infinite;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(-100%); opacity: 0; }
        }
        
        .carousel-slide-in {
            animation: slideIn 0.5s ease-out forwards;
        }
        
        .carousel-slide-out {
            animation: slideOut 0.5s ease-out forwards;
        }
        
        input[type="range"] {
            -webkit-appearance: none;
            background: transparent;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 14px;
            width: 14px;
            border-radius: 50%;
            background: linear-gradient(135deg, #c084fc 0%, #ec4899 100%);
            cursor: pointer;
            margin-top: -5px;
            box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        
        input[type="range"]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            background: rgba(168, 85, 247, 0.2);
            border-radius: 2px;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .glass-card-elevated {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .input-glow:focus {
            box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.3), 0 0 30px rgba(168, 85, 247, 0.15), inset 0 0 20px rgba(168, 85, 247, 0.05);
        }
        
        .btn-mechanical {
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn-mechanical:hover {
            transform: scale(1.02);
        }
        
        .btn-mechanical:active {
            transform: scale(0.98);
        }
        
        /* Grid pattern overlay */
        .pattern-grid {
            background-image: 
                linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px);
            background-size: 60px 60px;
        }
        
        /* Radial gradient pattern */
        .pattern-radial {
            background-image: radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.06) 0%, transparent 50%),
                              radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 60%);
        }
        
        /* Noise texture overlay */
        .pattern-noise {
            position: relative;
        }
        
        .pattern-noise::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.015;
            pointer-events: none;
        }
        
        /* Diagonal lines pattern */
        .pattern-diagonal {
            background-image: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(168, 85, 247, 0.02) 10px,
                rgba(168, 85, 247, 0.02) 11px
            );
        }
    `}</style>
);

// --- Documentation Footer Component ---
const DocumentationFooter = ({ language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const t = translations[language];
    
    return (
        <div className="mt-12 pt-8 border-t border-white/[0.04]">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="group w-full flex items-center justify-between py-5 px-6 glass-card rounded-2xl transition-all duration-300 hover:bg-white/[0.03] hover:border-purple-500/20"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
                        <DocumentationIcon />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-white tracking-tight">{t.documentation}</h3>
                        <p className="text-xs text-white/40 tracking-wide uppercase">Complete system architecture and API guide</p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-purple-400"
                >
                    <ChevronDownIcon />
                </motion.div>
            </motion.button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 p-6 glass-card-elevated rounded-2xl shadow-2xl shadow-black/20">
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-3 tracking-tight">
                                    <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white text-sm shadow-lg shadow-purple-500/20">&#x1F3D7;</span>
                                    {t.architecture}
                                </h4>
                               <div className="bg-black/40 rounded-xl p-5 overflow-x-auto border border-white/[0.04] w-full memory-scroll">
                                <pre className="text-xs text-purple-200/80 font-mono whitespace-pre leading-relaxed tracking-wide block min-w-[550px]">
{`
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                   │
│  • User authentication (Supabase Auth)                      │
│  • Real-time progress streaming (SSE)                       │
│  • Audio player with waveform visualization                 │
│  • Live captions synchronized with audio                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI + Uvicorn)                │
│  • RESTful API endpoints                                    │
│  • Daily credit management (3 credits/day)                  │
│  • Asynchronous job queue & progress tracking               │
│  • Server-Sent Events (SSE) for real-time updates           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI WORKFLOW (LangGraph)                    │
│  • Multi-agent orchestration framework                      │
│  • State graph with conditional routing                     │
│  • Subgraph composition for modular design                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  • Groq: Ultra-fast LLM inference (GPT-OSS-120B)            │
│  • Tavily: Real-time web search API                         │
│  • Google Cloud TTS: Neural text-to-speech voices           │
│  • Supabase: Authentication & credits database              │
└─────────────────────────────────────────────────────────────┘
`}
                                    </pre>
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-3 tracking-tight">
                                    <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-sm shadow-lg shadow-cyan-500/20">&#x1F50C;</span>
                                    {t.apiEndpoints}
                                </h4>
                                <div className="grid gap-3">
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/[0.04] hover:border-purple-500/20 transition-all">
                                        <code className="text-sm font-mono text-cyan-400 font-semibold tracking-wide">POST /generate-podcast</code>
                                        <p className="text-xs text-white/40 mt-2 tracking-wide">Starts podcast generation. Returns job_id for progress tracking.</p>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/[0.04] hover:border-purple-500/20 transition-all">
                                        <code className="text-sm font-mono text-fuchsia-400 font-semibold tracking-wide">GET /stream-progress/{'{job_id}'}</code>
                                        <p className="text-xs text-white/40 mt-2 tracking-wide">Server-Sent Events endpoint for real-time progress updates.</p>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/[0.04] hover:border-purple-500/20 transition-all">
                                        <code className="text-sm font-mono text-cyan-400 font-semibold tracking-wide">GET /user/credits</code>
                                        <p className="text-xs text-white/40 mt-2 tracking-wide">Returns daily credit usage and remaining credits.</p>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/[0.04] hover:border-purple-500/20 transition-all">
                                        <code className="text-sm font-mono text-fuchsia-400 font-semibold tracking-wide">GET /user/podcasts</code>
                                        <p className="text-xs text-white/40 mt-2 tracking-wide">Returns user&apos;s podcast history.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6 text-center border-t border-white/[0.04]">
                                <p className="text-white/60 font-semibold tracking-tight">Built with LangGraph, Groq, Google Cloud TTS & Supabase</p>
                                <p className="text-sm text-white/30 mt-1 tracking-wide">Developed by Aditya Jain</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Collapsible Thinking Process Component ---
const CollapsibleThinkingProcess = ({ logs, isComplete, language, onToggle, isExpanded }) => {
    const t = translations[language];
    const logsEndRef = useRef(null);

    useEffect(() => {
        if (isExpanded) {
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, isExpanded]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-elevated rounded-2xl overflow-hidden shadow-2xl shadow-black/30 mb-6"
        >
            <button
                onClick={onToggle}
                className="w-full bg-gradient-to-r from-purple-600/90 via-fuchsia-600/90 to-purple-600/90 px-6 py-5 flex items-center justify-between hover:from-purple-500/90 hover:via-fuchsia-500/90 hover:to-purple-500/90 transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 ${isComplete ? 'bg-emerald-400' : 'bg-amber-400'} rounded-full animate-pulse shadow-lg ${isComplete ? 'shadow-emerald-400/50' : 'shadow-amber-400/50'}`}></div>
                    <h3 className="text-white font-semibold tracking-tight">
                        {isComplete ? "✓ " + t.thinkingProcess + " Complete" : "⚡ " + t.thinkingProcess}
                    </h3>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                    <span className="text-xs font-medium uppercase tracking-widest">{isExpanded ? t.hideLogs : t.showLogs}</span>
                    <span>{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
                </div>
            </button>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="h-72 overflow-y-auto p-5 font-mono text-sm thinking-process-scroll bg-black/40">
                            {logs.map((log, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                                    className="mb-4 pb-3 border-b border-white/[0.04] last:border-0"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-purple-400/80 text-xs font-mono tracking-wider whitespace-nowrap">
                                            {log.timestamp ? new Date(log.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString()}
                                        </span>
                                        <span className={`text-sm leading-relaxed ${log.status === 'error' ? 'text-red-400' : 'text-white/70'}`}>
                                            {log.message}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- Audio Player with Waveform and Captions ---
const AudioPlayerWithCaptions = ({ audioUrl, script, onDownload, onNewPodcast }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentCaption, setCurrentCaption] = useState("");
    const [parsedSegments, setParsedSegments] = useState([]);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastActiveSegmentRef = useRef(null);

    const getRawSegments = useCallback(() => {
        const lines = script.split('\n');
        const segments = [];
        let currentSpeaker = '';
        let textBlock = '';

        for (const line of lines) {
            const interviewerMatch = line.match(/\*\*Interviewer:\*\*\s*(.*)/);
            const expertMatch = line.match(/\*\*Expert:\*\*\s*(.*)/);

            if (interviewerMatch) {
                if (textBlock) segments.push({ speaker: currentSpeaker, rawText: textBlock });
                currentSpeaker = 'Interviewer';
                textBlock = interviewerMatch[1];
            } else if (expertMatch) {
                if (textBlock) segments.push({ speaker: currentSpeaker, rawText: textBlock });
                currentSpeaker = 'Expert';
                textBlock = expertMatch[1];
            } else if (textBlock && line.trim() && !line.startsWith('---')) {
                textBlock += ' ' + line.trim();
            }
        }
        if (textBlock) segments.push({ speaker: currentSpeaker, rawText: textBlock });

        return segments.map(seg => {
            const break800s = (seg.rawText.match(/<break time=["']800ms["']\s*\/?>/g) || []).length;
            const break500s = (seg.rawText.match(/<break time=["']500ms["']\s*\/?>/g) || []).length;
            const break1s = (seg.rawText.match(/<break time=["']1s["']\s*\/?>/g) || []).length;

            const internalSilence = (break800s * 0.8) + (break500s * 0.5) + (break1s * 1.0);
            const cleanText = seg.rawText.replace(/<[^>]*>/g, '').replace(/\*/g, '').trim();

            return {
                speaker: seg.speaker,
                text: cleanText,
                charCount: cleanText.length,
                internalSilence: internalSilence
            };
        });
    }, [script]);

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        
        const totalDuration = audioRef.current.duration;
        setDuration(totalDuration);
        
        const segments = getRawSegments();
        const totalChars = segments.reduce((acc, seg) => acc + seg.charCount, 0);
        
        // Use a clean 350ms static padding gap between discrete speaker exchanges
        const baseTransitionGap = 0.35;
        const totalSilence = segments.reduce((acc, seg) => acc + seg.internalSilence, 0) + (segments.length * baseTransitionGap);
        
        const trueSpeakingDuration = Math.max(0, totalDuration - totalSilence);
        const trueSecPerChar = totalChars > 0 ? trueSpeakingDuration / totalChars : 0;
        
        let timelineCursor = 0;
        const timedSegments = segments.map((seg) => {
            const speakingDuration = seg.charCount * trueSecPerChar;
            const start = timelineCursor;
            const end = start + speakingDuration + seg.internalSilence;
            
            // Increment cursor directly to the edge of the next transition window
            timelineCursor = end + baseTransitionGap;
            return { ...seg, start, end };
        });
        
        setParsedSegments(timedSegments);
    };

    const initAudioVisualizer = () => {
        if (!audioCtxRef.current && audioRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContext();
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 128;
            
            const source = audioCtxRef.current.createMediaElementSource(audioRef.current);
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioCtxRef.current.destination);
        }
        
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const drawWaveform = useCallback(() => {
        if (!analyserRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        analyserRef.current.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const usableLength = 32;
        const barWidth = canvas.width / (usableLength * 2);
        const centerY = canvas.height / 2;
        const centerX = canvas.width / 2;
        
        // Gradient from purple to fuchsia matching logo
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#c084fc');
        gradient.addColorStop(0.5, '#e879f9');
        gradient.addColorStop(1, '#c084fc');
        ctx.fillStyle = gradient;
        
        for (let i = 0; i < usableLength; i++) {
            const value = dataArray[i];
            const barHeight = Math.max(3, (value / 255) * canvas.height * 0.8);
            
            ctx.fillRect(centerX + (i * barWidth), centerY - barHeight / 2, barWidth - 2, barHeight);
            ctx.fillRect(centerX - ((i + 1) * barWidth), centerY - barHeight / 2, barWidth - 2, barHeight);
        }
        
        animationFrameRef.current = requestAnimationFrame(drawWaveform);
    }, []);

    useEffect(() => {
        if (isPlaying) {
            initAudioVisualizer();
            audioRef.current.play().catch(e => console.error("Play error:", e));
            animationFrameRef.current = requestAnimationFrame(drawWaveform);
        } else {
            audioRef.current?.pause();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, drawWaveform]);

    const handleTimeUpdate = useCallback(() => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        setCurrentTime(current);
        
        // Strict boundary lookups map text layers exactly to the elapsed audio clock
        const activeSegment = parsedSegments.find(seg => 
            current >= seg.start && current <= seg.end
        );
        
        if (activeSegment && activeSegment !== lastActiveSegmentRef.current) {
            setCurrentCaption(`${activeSegment.speaker}: ${activeSegment.text}`);
            lastActiveSegmentRef.current = activeSegment;
        }
    }, [parsedSegments]);

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const skipBackward = () => {
        if (audioRef.current) {
            const newTime = Math.max(0, audioRef.current.currentTime - 10);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const skipForward = () => {
        if (audioRef.current) {
            const newTime = Math.min(duration, audioRef.current.currentTime + 10);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const formatTime = (timeInSecs) => {
        const m = Math.floor(timeInSecs / 60).toString().padStart(2, '0');
        const s = Math.floor(timeInSecs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-elevated rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
        >
            <div className="bg-gradient-to-r from-purple-600/90 via-fuchsia-600/90 to-purple-600/90 px-6 py-5">
                <h3 className="text-white font-semibold flex items-center gap-3 tracking-tight">
                    <span className="text-xl">&#x1F3A7;</span> Now Playing
                </h3>
            </div>

            <audio
                ref={audioRef}
                src={audioUrl}
                crossOrigin="anonymous"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />

            <div className="p-6 bg-black/20">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <motion.button 
                            onClick={skipBackward} 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.05] rounded-full transition-all"
                        >
                            <RewindIcon />
                        </motion.button>
                        <motion.button 
                            onClick={() => setIsPlaying(!isPlaying)} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/30 animate-pulse-glow"
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </motion.button>
                        <motion.button 
                            onClick={skipForward} 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.05] rounded-full transition-all"
                        >
                            <ForwardIcon />
                        </motion.button>
                        <div className="ml-4">
                            <h4 className="font-bold text-white tracking-tight">AI-Generated Podcast</h4>
                            <p className="text-sm text-white/40">Dynamic conversation with AI experts</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <motion.button 
                            onClick={onNewPodcast} 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2.5 rounded-xl bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white transition-all flex items-center gap-2 text-sm border border-white/[0.06] btn-mechanical"
                        >
                            <NewIcon /> New
                        </motion.button>
                        <motion.button 
                            onClick={onDownload} 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 text-sm btn-mechanical"
                        >
                            <DownloadIcon /> Download
                        </motion.button>
                    </div>
                </div>

                <div className="mb-6 bg-black/40 rounded-xl p-5 border border-white/[0.04]">
                    <canvas ref={canvasRef} width="800" height="60" className="w-full h-16 rounded-md mb-4" />
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-purple-400 font-mono tracking-wider">{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek} className="flex-1 cursor-pointer" />
                        <span className="text-xs text-purple-400 font-mono tracking-wider">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="bg-black/40 rounded-xl p-6 border border-white/[0.04] min-h-[120px]">
                    {currentCaption ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                                {currentCaption.split(':')[0]}
                            </span>
                            <p className="text-white/80 mt-2 leading-relaxed text-lg">
                                {currentCaption.substring(currentCaption.indexOf(':') + 1)}
                            </p>
                        </motion.div>
                    ) : (
                        <p className="text-white/30 text-center mt-6 tracking-wide">
                            &#x1F399; Captions will appear here as the podcast plays...
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// --- Transcript Viewer with Markdown ---
const TranscriptViewer = ({ script }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const cleanScript = script ? script.replace(/<[^>]*>/g, '') : "";

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-elevated rounded-2xl overflow-hidden shadow-2xl shadow-black/30"
        >
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full bg-gradient-to-r from-fuchsia-600/80 via-purple-600/80 to-fuchsia-600/80 px-6 py-5 flex items-center justify-between hover:from-fuchsia-500/80 hover:via-purple-500/80 hover:to-fuchsia-500/80 transition-all">
                <h3 className="font-semibold text-white flex items-center gap-3 tracking-tight">&#x1F4C4; Full Transcript</h3>
                <span className="text-white/80">{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="p-6 max-h-[400px] overflow-y-auto bg-black/30 transcript-scroll">
                            <div className="text-white/70 font-sans text-sm leading-relaxed prose prose-invert max-w-none prose-headings:text-white prose-strong:text-purple-300">
                                <ReactMarkdown>{cleanScript}</ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- Credit Display Component ---
const CreditDisplay = ({ credits, creditsUsed, dailyLimit, resetsInSeconds, language }) => {
    const [timeRemaining, setTimeRemaining] = useState(resetsInSeconds);
    const t = translations[language];
    
    useEffect(() => {
        if (resetsInSeconds <= 0) return;
        const timer = setInterval(() => setTimeRemaining(prev => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(timer);
    }, [resetsInSeconds]);
    
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };
    
    return (
        <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">{credits}</div>
                    <div className="text-xs text-white/40 uppercase tracking-widest">{t.creditsLeft}</div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-mono text-white/60 tracking-wide">{creditsUsed}/{dailyLimit} {t.usedToday}</div>
                    {credits === 0 && timeRemaining > 0 && (
                        <div className="text-xs text-amber-400/80 mt-1">Resets in {formatTime(timeRemaining)}</div>
                    )}
                </div>
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(creditsUsed / dailyLimit) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 rounded-full" 
                />
            </div>
        </div>
    );
};

const PodcastCard = ({ podcast, onPlay, onDelete, language }) => {
    const t = translations[language];
    const date = new Date(podcast.created_at).toLocaleDateString();
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="glass-card rounded-xl p-4 sm:p-5 hover:bg-white/[0.03] hover:border-cyan-500/20 transition-all duration-300 group w-full"
        >
            {/* Added min-w-0 here to prevent children from swelling the layout */}
            <div className="flex justify-between items-center gap-2 w-full min-w-0">
                
                {/* Enforced min-w-0 on the text block to make truncate work natively */}
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                    <h3 className="font-semibold text-white text-base sm:text-lg tracking-tight truncate">
                        {podcast.topic}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/30 mt-1 font-mono tracking-wider">
                        {date}
                    </p>
                </div>
                
                {/* Action buttons are locked down tightly so they never shrink or move */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <motion.button 
                        onClick={() => onPlay(podcast)} 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 transition-all"
                        title={t.play}
                    >
                        <PlayIcon />
                    </motion.button>

                    <motion.button 
                        onClick={() => window.open(podcast.audio_url, '_blank')} 
                        whileHover={{ scale: 1.15 }}
                        className="text-white/40 hover:text-cyan-400 transition-colors p-1"
                    >
                        <DownloadIcon />
                    </motion.button>
                    
                    <motion.button 
                        onClick={() => onDelete(podcast.job_id)} 
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-white/30 hover:text-red-400 transition-colors p-1"
                    >
                        <DeleteIcon />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

// --- Authentication Component (Redesigned with Image Slider) ---
const AuthScreen = ({ onAuth, setSession }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const t = translations.en;

    const carouselImages = [
        {
            url: "https://fairoaksrecoverycenter.com/wp-content/uploads/2025/04/listening-podcast-1000x667-1.jpg",
            quote: "Create professional podcasts in minutes with AI",
            benefit: "AI-Powered Generation"
        },
        {
            url: "https://www.salon.com/app/uploads/2019/12/man-with-headphones-and-coffee-12271.jpg",
            quote: "High-quality audio with natural voices",
            benefit: "Natural Text-to-Speech"
        },
        {
            url: "https://miro.medium.com/v2/resize:fit:1200/1*7nJmYy0iBTFrBRnoGJ29ww.jpeg",
            quote: "Perfect for students, creators, and professionals",
            benefit: "Learn Anywhere, Anytime"
        },
        {
            url: "https://cdn.prod.website-files.com/5d70d85d6d5a384776dc97e4/64474a1c4fbf67541fda4e3e_listening%20to%20podcasts.webp",
            quote: "Save and access your podcasts anytime",
            benefit: "Cloud Storage Included"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
                setTimeout(() => setIsAnimating(false), 100);
            }, 300);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let result;
            if (isLogin) {
                result = await supabase.auth.signInWithPassword({ email, password });
            } else {
                result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
            }
            if (result.error) throw result.error;
            if (result.data.session) {
                setSession(result.data.session);
                onAuth(true);
            } else if (result.data.user && !isLogin) {
                setError("Check your email for confirmation link.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const currentImage = carouselImages[currentImageIndex];

    return (
        <div className="min-h-screen bg-[#0a0118] flex pattern-grid pattern-radial">
            {/* Left Side - Image Carousel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-950/90 via-[#0a0118]/80 to-fuchsia-950/90 z-10"></div>
                <img 
                    src={currentImage.url}
                    alt="Podcast Studio"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-60'}`}
                />
                <div className="absolute bottom-0 left-0 right-0 z-20 p-12 bg-gradient-to-t from-[#0a0118] via-[#0a0118]/90 to-transparent">
                    <motion.p 
                        key={currentImageIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-white text-3xl font-bold mb-6 tracking-tight"
                    >
                        {currentImage.quote}
                    </motion.p>
                    <div className="flex gap-2 mb-8">
                        {carouselImages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setIsAnimating(true);
                                    setTimeout(() => {
                                        setCurrentImageIndex(idx);
                                        setTimeout(() => setIsAnimating(false), 100);
                                    }, 300);
                                }}
                                className={`h-1 rounded-full transition-all duration-500 ${idx === currentImageIndex ? 'w-10 bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500' : 'w-4 bg-white/20'}`}
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {carouselImages.map((img, idx) => (
                            <div className="flex items-center gap-3 text-white/50 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"></span>
                                <span>{img.benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative pattern-diagonal">
                {/* Ambient glow effects */}
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-md w-full relative z-10"
                >
                    <div className="text-center mb-10">
                        <div className="relative inline-block">
                            <img src={logoImage} alt="Logo" className="w-20 h-20 mx-auto mb-5 rounded-2xl shadow-2xl shadow-purple-500/30 object-cover" />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 blur-xl"></div>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Podcast Studio</h1>
                        <p className="text-white/40 tracking-wide">AI-Powered Podcast Generator</p>
                        <div className="mt-4 inline-block glass-card rounded-full px-4 py-2">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 text-sm font-semibold">3 Free Credits Daily</span>
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                        >
                            <p className="text-red-400 text-sm">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl bg-white/[0.03] text-white placeholder-white/30 border border-white/[0.06] focus:outline-none focus:border-purple-500/50 transition-all input-glow"
                                placeholder="Email address"
                                required
                            />
                        </div>
                        <div className="relative group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl bg-white/[0.03] text-white placeholder-white/30 border border-white/[0.06] focus:outline-none focus:border-purple-500/50 transition-all input-glow"
                                placeholder="Password"
                                required
                            />
                        </div>
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white font-semibold hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500 transition-all disabled:opacity-50 shadow-xl shadow-purple-500/20"
                        >
                            {loading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
                        </motion.button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/[0.06]"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-4 bg-[#0a0118] text-white/30 uppercase tracking-widest">Or continue with</span>
                            </div>
                        </div>

                        <motion.button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full py-4 rounded-xl bg-white/[0.03] text-white font-semibold hover:bg-white/[0.06] transition-all flex items-center justify-center gap-3 disabled:opacity-50 border border-white/[0.06]"
                        >
                            <GoogleIcon /> Google
                        </motion.button>

                        <p className="text-center text-white/40 text-sm mt-8">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 hover:from-cyan-300 hover:via-purple-300 hover:to-fuchsia-300 font-semibold"
                            >
                                {isLogin ? "Sign Up" : "Sign In"}
                            </button>
                        </p>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [session, setSession] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState("home");
    const [language, setLanguage] = useState("en");
    const [topic, setTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationLogs, setGenerationLogs] = useState([]);
    const [podcast, setPodcast] = useState(null);
    const [error, setError] = useState(null);
    const [isLogsExpanded, setIsLogsExpanded] = useState(true);
    const [credits, setCredits] = useState(0);
    const [creditsUsedToday, setCreditsUsedToday] = useState(0);
    const [dailyLimit, setDailyLimit] = useState(DAILY_CREDIT_LIMIT);
    const [resetsInSeconds, setResetsInSeconds] = useState(0);
    const [userPodcasts, setUserPodcasts] = useState([]);
    const [loadingPodcasts, setLoadingPodcasts] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
    
    const isMounted = useRef(true);
    const eventSourceRef = useRef(null);

    const checkBackendConnection = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/`, { method: 'GET', signal: AbortSignal.timeout(5000) });
            return response.ok;
        } catch (err) {
            return false;
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSession(session);
                setIsAuthenticated(true);
                fetchUserCredits(session.access_token);
                fetchUserPodcasts(session.access_token);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setSession(session);
                setIsAuthenticated(true);
                fetchUserCredits(session.access_token);
                fetchUserPodcasts(session.access_token);
            } else {
                setSession(null);
                setIsAuthenticated(false);
                setCredits(0);
                setCreditsUsedToday(0);
                setPodcast(null);
                setUserPodcasts([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserCredits = async (token) => {
        try {
            const response = await fetch(`${BACKEND_URL}/user/credits`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                setCredits(data.credits_remaining);
                setCreditsUsedToday(data.credits_used_today);
                setDailyLimit(data.daily_limit);
                setResetsInSeconds(data.resets_in_seconds);
            }
        } catch (err) { console.error("Failed to fetch credits:", err); }
    };

    const fetchUserPodcasts = async (token) => {
        setLoadingPodcasts(true);
        try {
            const response = await fetch(`${BACKEND_URL}/user/podcasts`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                setUserPodcasts(data.podcasts);
            }
        } catch (err) { console.error("Failed to fetch podcasts:", err); }
        finally { setLoadingPodcasts(false); }
    };

    const deletePodcast = async (jobId) => {
        try {
            await fetch(`${BACKEND_URL}/user/podcasts/${jobId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${session?.access_token}` } });
            setUserPodcasts(prev => prev.filter(p => p.job_id !== jobId));
        } catch (err) { console.error("Failed to delete podcast:", err); }
    };

    const playPodcast = (podcastData) => {
        setPodcast({ 
            audioUrl: `${BACKEND_URL}${podcastData.audio_url}`, 
            script: "Loading...", 
            topic: podcastData.topic, 
            jobId: podcastData.job_id 
        });
        fetch(`${BACKEND_URL}/user/podcasts/${podcastData.job_id}`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } })
            .then(res => res.json())
            .then(data => {
                setPodcast({ 
                    audioUrl: `${BACKEND_URL}${data.audio_url}`, 
                    script: data.script, 
                    topic: data.topic, 
                    jobId: data.job_id 
                });
            });
        setActiveTab("home");
    };

    const getAuthHeaders = () => ({ 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' });
    const t = translations[language];

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; if (eventSourceRef.current) eventSourceRef.current.close(); };
    }, []);

    const generatePodcast = async () => {
        if (!topic.trim() || credits <= 0) return;
        setIsGenerating(true);
        setGenerationLogs([{ step: 'start', status: 'started', message: `Starting podcast generation for: "${topic}"...`, timestamp: Date.now() / 1000 }]);
        try {
            const startRes = await fetch(`${BACKEND_URL}/generate-podcast`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ topic, language, speaker_voices: { "Interviewer": "male", "Expert": "female" } })
            });
            if (!startRes.ok) { const errorData = await startRes.json(); throw new Error(errorData.detail || "Generation failed"); }
            const { job_id, credits_remaining } = await startRes.json();
            setCredits(credits_remaining);
            setCreditsUsedToday(prev => prev + 1);
            eventSourceRef.current = new EventSource(`${BACKEND_URL}/stream-progress/${job_id}`);
            eventSourceRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'progress') {
                        setGenerationLogs(prev => [...prev, { ...data.data, timestamp: data.data.timestamp || Date.now() / 1000 }]);
                    } else if (data.type === 'complete') {
                        fetch(`${BACKEND_URL}/script/${job_id}`).then(res => res.json()).then(scriptData => {
                            if (isMounted.current) {
                                setPodcast({ audioUrl: `${BACKEND_URL}${data.download_url}`, script: scriptData.script, topic, jobId: job_id });
                                setIsGenerating(false);
                                fetchUserPodcasts(session?.access_token);
                            }
                        });
                        eventSourceRef.current?.close();
                        eventSourceRef.current = null;
                    } else if (data.type === 'error') {
                        setError(data.message);
                        setIsGenerating(false);
                        eventSourceRef.current?.close();
                        eventSourceRef.current = null;
                    }
                } catch (err) { console.error("Error parsing SSE:", err); }
            };
            eventSourceRef.current.onerror = () => {
                if (isMounted.current && !podcast) setError("Connection error");
                setIsGenerating(false);
                eventSourceRef.current?.close();
                eventSourceRef.current = null;
            };
        } catch (err) { setError(err.message); setIsGenerating(false); }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setIsAuthenticated(false);
        setPodcast(null);
        setUserPodcasts([]);
        if (eventSourceRef.current) eventSourceRef.current.close();
    };

    if (!isAuthenticated) {
        return <AuthScreen onAuth={setIsAuthenticated} setSession={setSession} />;
    }

    return (
        <>
            <GlobalStyles />
            <div className="flex flex-col lg:flex-row min-h-screen lg:h-dvh bg-[#0a0118] pattern-grid overflow-y-auto lg:overflow-hidden">
                
                {/* Sidebar Component (Responsive Stack) */}
                <div className="w-full lg:w-72 bg-[#0d0620] border-b lg:border-r border-white/[0.04] flex flex-col lg:h-full shrink-0 pattern-noise">
                    <div className="p-4 lg:p-6 border-b border-white/[0.04] flex flex-row lg:flex-col items-center justify-between lg:justify-start gap-4">
                        <div className="flex items-center gap-3 lg:block lg:text-center">
                            <img src={logoImage} alt="Logo" className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl mx-auto shadow-xl shadow-purple-500/20" />
                            <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight mt-0 lg:mt-4">
                                {t.appTitle}
                            </h1>
                        </div>
                        <p className="hidden lg:block text-xs text-white/30 text-center mt-1 uppercase tracking-widest">{t.tagline}</p>
                    </div>
                    
                    <nav className="p-3 lg:p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible shrink-0">
                        <motion.button 
                            onClick={() => setActiveTab("home")} 
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 lg:w-full px-4 py-2.5 lg:py-3.5 rounded-xl transition-all flex items-center justify-center lg:justify-start gap-3 whitespace-nowrap ${activeTab === "home" ? "bg-gradient-to-r from-purple-600/90 via-fuchsia-600/90 to-purple-600/90 text-white shadow-lg shadow-purple-500/20" : "text-white/50 hover:bg-white/[0.03] hover:text-white"}`}
                        >
                            <HomeIcon /> <span className="font-medium text-sm">{t.home}</span>
                        </motion.button>
                        <motion.button 
                            onClick={() => { setActiveTab("podcasts"); fetchUserPodcasts(session?.access_token); }} 
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 lg:w-full px-4 py-2.5 lg:py-3.5 rounded-xl transition-all flex items-center justify-center lg:justify-start gap-3 whitespace-nowrap ${activeTab === "podcasts" ? "bg-gradient-to-r from-purple-600/90 via-fuchsia-600/90 to-purple-600/90 text-white shadow-lg shadow-purple-500/20" : "text-white/50 hover:bg-white/[0.03] hover:text-white"}`}
                        >
                            <PodcastIcon /> <span className="font-medium text-sm">{t.yourPodcasts}</span>
                        </motion.button>
                    </nav>
                    
                    <div className="hidden lg:block p-4 border-t border-white/[0.04] space-y-4">
                        <CreditDisplay credits={credits} creditsUsed={creditsUsedToday} dailyLimit={dailyLimit} resetsInSeconds={resetsInSeconds} language={language} />
                        <div className="flex gap-2">
                            <button onClick={() => setLanguage('en')} className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-all ${language === 'en' ? 'bg-purple-600 text-white' : 'bg-white/[0.02] text-white/40'}`}>EN</button>
                            <button onClick={() => setLanguage('hi')} className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-all ${language === 'hi' ? 'bg-purple-600 text-white' : 'bg-white/[0.02] text-white/40'}`}>HI</button>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/[0.04] flex flex-col gap-4 items-center w-full lg:block">
    
                    {/* Enforces full width stretching and clear item alignment grids across small viewports */}
                    <div className="w-full lg:hidden block">
                        <CreditDisplay 
                            credits={credits} 
                            creditsUsed={creditsUsedToday} 
                            dailyLimit={dailyLimit} 
                            resetsInSeconds={resetsInSeconds} 
                            language={language} 
                        />
                    </div>

                    {/* Center positions the logout interface actions beautifully directly underneath the credit row */}
                    <motion.button 
                        onClick={handleLogout} 
                        whileTap={{ scale: 0.98 }}
                        className="w-full lg:w-auto lg:mt-4 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium flex items-center justify-center gap-2 border border-red-500/20 whitespace-nowrap"
                    >
                        <LogoutIcon /> 
                        <span>{t.logout}</span>
                    </motion.button>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto relative pattern-radial">
                    {/* Ambient background effects */}
                    <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="fixed bottom-0 left-1/4 w-1/3 h-1/3 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="fixed top-1/2 right-1/4 w-1/4 h-1/4 bg-cyan-600/3 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="max-w-4xl mx-auto px-6 py-10 relative z-10">
                        {activeTab === "home" && (
                            <>
                                {credits > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className="glass-card-elevated rounded-2xl p-8 mb-8 shadow-2xl shadow-black/30"
                                    >
                                        <label className="block text-white font-semibold mb-3 tracking-tight">{t.topicLabel}</label>
                                        <div className="flex flex-col sm:flex-row gap-3 relative">
                                            <div className={`w-full sm:flex-1 relative ${inputFocused ? 'z-10' : ''}`}>
                                                <input 
                                                    type="text" 
                                                    value={topic} 
                                                    onChange={(e) => setTopic(e.target.value)} 
                                                    onKeyDown={(e) => e.key === 'Enter' && generatePodcast()} 
                                                    onFocus={() => setInputFocused(true)}
                                                    onBlur={() => setInputFocused(false)}
                                                    disabled={isGenerating} 
                                                    placeholder={t.topicPlaceholder} 
                                                    className="w-full px-6 py-4 rounded-xl bg-black/40 text-white placeholder-white/25 border border-white/[0.06] focus:outline-none focus:border-purple-500/50 transition-all input-glow text-lg" 
                                                />
                                                {inputFocused && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="absolute inset-0 -z-10 rounded-xl bg-purple-500/10 blur-2xl"
                                                    />
                                                )}
                                            </div>
                                        <motion.button 
                                            onClick={generatePodcast} 
                                            disabled={!topic.trim() || isGenerating || credits <= 0} 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`px-8 py-4 rounded-xl font-semibold transition-all shadow-xl btn-mechanical ${!topic.trim() || isGenerating || credits <= 0 ? 'bg-white/[0.03] text-white/30 cursor-not-allowed border border-white/[0.04]' : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500 shadow-purple-500/20'}`}
                                        >
                                                {isGenerating ? t.generating : t.generateButton}
                                            </motion.button>
                                        </div>
                                        <div className="mt-6">
                                            <p className="text-xs text-white/30 mb-3 uppercase tracking-widest">{t.tryThese}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {["AI in Healthcare", "Future of Space Travel", "Climate Solutions", "Digital Art Revolution", "Quantum Computing", "Mars Colonization"].map((sample, idx) => (
                                                    <motion.button 
                                                        key={idx} 
                                                        onClick={() => setTopic(sample)} 
                                                        whileHover={{ scale: 1.05, y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white rounded-full text-sm transition-all border border-white/[0.04] hover:border-purple-500/30"
                                                    >
                                                        {sample}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {credits <= 0 && !isGenerating && !podcast && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-10 text-center"
                                    >
                                        <div className="text-6xl mb-5">&#x26A0;&#xFE0F;</div>
                                        <h3 className="text-xl font-semibold text-amber-400 mb-3 tracking-tight">{t.dailyLimitReached}</h3>
                                        <p className="text-amber-300/70">{t.outOfCredits.replace('{limit}', dailyLimit)}</p>
                                    </motion.div>
                                )}

                                {(isGenerating || generationLogs.length > 0) && generationLogs.length > 0 && (
                                    <CollapsibleThinkingProcess logs={generationLogs} isComplete={!!podcast && !isGenerating} language={language} isExpanded={isLogsExpanded} onToggle={() => setIsLogsExpanded(!isLogsExpanded)} />
                                )}

                                {podcast && !isGenerating && (
                                    <div className="space-y-6">
                                        <AudioPlayerWithCaptions audioUrl={podcast.audioUrl} script={podcast.script} onDownload={() => window.open(podcast.audioUrl, '_blank')} onNewPodcast={() => { if (eventSourceRef.current) eventSourceRef.current.close(); setPodcast(null); setTopic(""); setGenerationLogs([]); setError(null); if (session) fetchUserCredits(session.access_token); }} />
                                        <TranscriptViewer script={podcast.script} />
                                    </div>
                                )}

                                <DocumentationFooter language={language} />

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center mt-6"
                                    >
                                        <p className="text-red-400">{error}</p>
                                        <button onClick={() => setError(null)} className="mt-3 text-sm text-red-500 hover:text-red-400 underline underline-offset-4">Dismiss</button>
                                    </motion.div>
                                )}
                            </>
                        )}
                        
                        {activeTab === "podcasts" && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6"
                            >
                                <h2 className="text-3xl font-bold text-white tracking-tight">{t.yourPodcasts}</h2>
                                {loadingPodcasts && (
                                    <div className="text-center py-16 text-white/40">
                                        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        {t.loading}
                                    </div>
                                )}
                                {!loadingPodcasts && userPodcasts.length === 0 && (
                                    <div className="glass-card-elevated rounded-2xl p-16 text-center">
                                        <p className="text-white/40 mb-6">{t.noPodcasts}</p>
                                        <motion.button 
                                            onClick={() => setActiveTab("home")} 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="px-8 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white rounded-xl hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500 transition-all shadow-xl shadow-purple-500/20"
                                        >
                                            {t.newPodcast}
                                        </motion.button>
                                    </div>
                                )}
                                {userPodcasts.length > 0 && (
                                    <div className="grid gap-4">
                                        {userPodcasts.map((podcast, idx) => (
                                            <motion.div
                                                key={podcast.job_id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <PodcastCard podcast={podcast} onPlay={playPodcast} onDelete={deletePodcast} language={language} />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
