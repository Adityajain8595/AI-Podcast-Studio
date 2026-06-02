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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
            font-family: 'Inter', sans-serif;
        }
        
        .thinking-process-scroll::-webkit-scrollbar {
            width: 6px;
        }
        
        .thinking-process-scroll::-webkit-scrollbar-track {
            background: #1a0a2e;
            border-radius: 3px;
        }
        
        .thinking-process-scroll::-webkit-scrollbar-thumb {
            background: #7c3aed;
            border-radius: 3px;
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
    `}</style>
);

// --- Documentation Footer Component ---
const DocumentationFooter = ({ language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const t = translations[language];
    
    return (
        <div className="mt-12 pt-8 border-t border-purple-800/30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group w-full flex items-center justify-between py-4 px-6 bg-purple-900/50 hover:bg-purple-800/50 backdrop-blur-sm rounded-2xl transition-all duration-300 border border-purple-700/30"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg text-white">
                        <DocumentationIcon />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-white">{t.documentation}</h3>
                        <p className="text-xs text-purple-300">Complete system architecture and API guide</p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-purple-400"
                >
                    <ChevronDownIcon />
                </motion.div>
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 p-6 bg-purple-900/30 backdrop-blur-sm rounded-2xl border border-purple-700/30 shadow-xl">
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm">🏗️</span>
                                    {t.architecture}
                                </h4>
                                <div className="bg-purple-950/50 rounded-xl p-5 overflow-x-auto">
                                    <pre className="text-xs text-purple-200 font-mono whitespace-pre-wrap leading-relaxed">
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
└─────────────────────────────────────────────────────────────┘`}
                                    </pre>
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm">🔌</span>
                                    {t.apiEndpoints}
                                </h4>
                                <div className="grid gap-2">
                                    <div className="p-3 bg-purple-950/50 rounded-xl border border-purple-700/30">
                                        <code className="text-sm font-mono text-pink-400 font-semibold">POST /generate-podcast</code>
                                        <p className="text-xs text-purple-300 mt-1">Starts podcast generation. Returns job_id for progress tracking.</p>
                                    </div>
                                    <div className="p-3 bg-purple-950/50 rounded-xl border border-purple-700/30">
                                        <code className="text-sm font-mono text-purple-400 font-semibold">GET /stream-progress/{'{job_id}'}</code>
                                        <p className="text-xs text-purple-300 mt-1">Server-Sent Events endpoint for real-time progress updates.</p>
                                    </div>
                                    <div className="p-3 bg-purple-950/50 rounded-xl border border-purple-700/30">
                                        <code className="text-sm font-mono text-pink-400 font-semibold">GET /user/credits</code>
                                        <p className="text-xs text-purple-300 mt-1">Returns daily credit usage and remaining credits.</p>
                                    </div>
                                    <div className="p-3 bg-purple-950/50 rounded-xl border border-purple-700/30">
                                        <code className="text-sm font-mono text-purple-400 font-semibold">GET /user/podcasts</code>
                                        <p className="text-xs text-purple-300 mt-1">Returns user's podcast history.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6 text-center border-t border-purple-800/30">
                                <p className="text-purple-400 font-semibold">Built with LangGraph, Groq, Google Cloud TTS & Supabase</p>
                                <p className="text-sm text-purple-500 mt-1">Developed by Aditya Jain</p>
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
        <div className="bg-purple-950/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-700/30 shadow-2xl mb-6">
            <button
                onClick={onToggle}
                className="w-full bg-purple-800 px-6 py-4 flex items-center justify-between hover:bg-purple-700 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${isComplete ? 'bg-green-400' : 'bg-yellow-400'} rounded-full animate-pulse`}></div>
                    <h3 className="text-white font-semibold">
                        {isComplete ? "✓ " + t.thinkingProcess + " Complete" : "⚡ " + t.thinkingProcess}
                    </h3>
                </div>
                <div className="flex items-center gap-2 text-white">
                    <span className="text-sm">{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
                    <span className="text-xs opacity-75">{isExpanded ? t.hideLogs : t.showLogs}</span>
                </div>
            </button>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="h-64 overflow-y-auto p-4 font-mono text-sm thinking-process-scroll">
                            {logs.map((log, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                                    className="mb-3 pb-2 border-b border-purple-800/50 last:border-0"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-purple-400 text-xs">
                                            {log.timestamp ? new Date(log.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString()}
                                        </span>
                                        <span className={`text-sm ${log.status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
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
        </div>
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
        const betweenChunkSilence = Math.max(0, (segments.length - 1) * 0.5);
        const internalSilence = segments.reduce((acc, seg) => acc + seg.internalSilence, 0);
        
        const totalSilence = betweenChunkSilence + internalSilence;
        const speakingTime = Math.max(0, totalDuration - totalSilence);
        const timePerChar = speakingTime / totalChars;
        
        let trackTime = 0;
        const timedSegments = segments.map((seg) => {
            const speakingDuration = seg.charCount * timePerChar;
            const totalSegDuration = speakingDuration + seg.internalSilence;
            const start = trackTime;
            const end = start + totalSegDuration;
            trackTime = end + 0.5;
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
        
        ctx.fillStyle = '#a855f7';
        
        for (let i = 0; i < usableLength; i++) {
            const value = dataArray[i];
            const barHeight = Math.max(3, (value / 255) * canvas.height * 0.8);
            
            ctx.fillRect(centerX + (i * barWidth), centerY - barHeight / 2, barWidth - 1, barHeight);
            ctx.fillRect(centerX - ((i + 1) * barWidth), centerY - barHeight / 2, barWidth - 1, barHeight);
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
        
        const activeSegment = parsedSegments.find(seg => 
            current >= seg.start && current <= (seg.end + 0.5)
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
        <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl border border-purple-700/30 overflow-hidden">
            <div className="bg-purple-800 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <span>🎧</span> Now Playing
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

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-6">
                        <button onClick={skipBackward} className="w-10 h-10 flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-800 rounded-full transition-colors">
                            <RewindIcon />
                        </button>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 hover:shadow-lg hover:scale-105 transition-all">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button onClick={skipForward} className="w-10 h-10 flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-800 rounded-full transition-colors">
                            <ForwardIcon />
                        </button>
                        <div className="ml-2">
                            <h4 className="font-bold text-white">AI-Generated Podcast</h4>
                            <p className="text-sm text-purple-300">Dynamic conversation with AI experts</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onNewPodcast} className="px-4 py-2 rounded-xl bg-purple-800/50 text-purple-200 hover:bg-purple-700 transition-all flex items-center gap-2 text-sm border border-purple-600/50">
                            <NewIcon /> New
                        </button>
                        <button onClick={onDownload} className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 hover:shadow-lg transition-all flex items-center gap-2 text-sm">
                            <DownloadIcon /> Download
                        </button>
                    </div>
                </div>

                <div className="mb-6 bg-purple-950/50 rounded-xl p-4 border border-purple-700/30">
                    <canvas ref={canvasRef} width="800" height="60" className="w-full h-16 rounded-md mb-2" />
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-purple-400 font-mono">{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek} className="flex-1 h-2 bg-purple-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        <span className="text-xs text-purple-400 font-mono">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="bg-purple-950/50 rounded-xl p-5 border border-purple-700/30 min-h-[100px]">
                    {currentCaption ? (
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-pink-400">
                                {currentCaption.split(':')[0]}
                            </span>
                            <p className="text-gray-200 mt-1 leading-relaxed">
                                {currentCaption.substring(currentCaption.indexOf(':') + 1)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-purple-400 text-center mt-4">
                            🎙️ Captions will appear here as the podcast plays...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Transcript Viewer with Markdown ---
const TranscriptViewer = ({ script }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const cleanScript = script ? script.replace(/<[^>]*>/g, '') : "";

    return (
        <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl border border-purple-700/30 overflow-hidden">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full bg-purple-800/50 px-6 py-4 flex items-center justify-between hover:bg-purple-800 transition-all">
                <h3 className="font-semibold text-white flex items-center gap-2">📄 Full Transcript</h3>
                <span className="text-purple-400">{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="p-6 max-h-[400px] overflow-y-auto bg-purple-950/30">
                            <div className="text-gray-200 font-sans text-sm leading-relaxed prose prose-invert max-w-none">
                                <ReactMarkdown>{cleanScript}</ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
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
        <div className="bg-purple-900/50 rounded-xl p-3 border border-purple-700/30">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-bold text-pink-400">{credits}</div>
                    <div className="text-xs text-purple-300">{t.creditsLeft}</div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium text-purple-200">{creditsUsed}/{dailyLimit} {t.usedToday}</div>
                    {credits === 0 && timeRemaining > 0 && (
                        <div className="text-xs text-orange-400">Resets in {formatTime(timeRemaining)}</div>
                    )}
                </div>
            </div>
            <div className="mt-2 h-2 bg-purple-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${(creditsUsed / dailyLimit) * 100}%` }} />
            </div>
        </div>
    );
};

// --- Podcast Card Component ---
const PodcastCard = ({ podcast, onPlay, onDelete, language }) => {
    const t = translations[language];
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const date = new Date(podcast.created_at).toLocaleDateString();
    
    return (
        <div className="bg-purple-900/30 backdrop-blur-sm rounded-xl border border-purple-700/30 p-5 hover:shadow-xl hover:border-purple-500/50 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{podcast.topic}</h3>
                    <p className="text-xs text-purple-400 mt-1">{date}</p>
                </div>
                <button onClick={() => onDelete(podcast.job_id)} className="text-purple-400 hover:text-red-400 transition-colors">
                    <DeleteIcon />
                </button>
            </div>
            <p className="text-sm text-purple-200 mb-4 line-clamp-2">{podcast.script_preview}</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => { if(audioRef.current) { if(isPlaying) audioRef.current.pause(); else audioRef.current.play(); setIsPlaying(!isPlaying); } }} className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 hover:shadow-md transition-all">
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <audio ref={audioRef} src={podcast.audio_url} onEnded={() => setIsPlaying(false)} />
                    <button onClick={() => window.open(podcast.audio_url, '_blank')} className="text-purple-300 hover:text-white transition-colors">
                        <DownloadIcon />
                    </button>
                </div>
                <button onClick={() => onPlay(podcast)} className="px-4 py-2 rounded-xl bg-purple-800/50 text-purple-200 hover:bg-purple-700 transition-all text-sm font-medium border border-purple-600/50">
                    {t.play} →
                </button>
            </div>
        </div>
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
            url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=600&fit=crop",
            quote: "Create professional podcasts in minutes with AI",
            benefit: "🎙️ AI-Powered Generation"
        },
        {
            url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=600&fit=crop",
            quote: "High-quality audio with natural voices",
            benefit: "🗣️ Natural Text-to-Speech"
        },
        {
            url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=600&fit=crop",
            quote: "Perfect for students, creators, and professionals",
            benefit: "📚 Learn Anywhere, Anytime"
        },
        {
            url: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&h=600&fit=crop",
            quote: "Save and access your podcasts anytime",
            benefit: "💾 Cloud Storage Included"
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
        <div className="min-h-screen bg-purple-950 flex">
            {/* Left Side - Image Carousel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-950/70 z-10"></div>
                <img 
                    src={currentImage.url}
                    alt="Podcast Studio"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}
                />
                <div className="absolute bottom-0 left-0 right-0 z-20 p-12 bg-gradient-to-t from-purple-950 via-purple-950/80 to-transparent">
                    <p className={`text-white text-2xl font-bold mb-4 transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-y-10' : 'opacity-100 transform translate-y-0'}`}>
                        {currentImage.quote}
                    </p>
                    <div className="flex gap-2">
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
                                className={`h-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-8 bg-pink-500' : 'w-4 bg-purple-500'}`}
                            />
                        ))}
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        {carouselImages.map((img, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-purple-300 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                                {img.benefit}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <img src={logoImage} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-full shadow-lg object-cover" />
                        <h1 className="text-3xl font-bold text-white mb-2">Podcast Studio</h1>
                        <p className="text-purple-300">AI-Powered Podcast Generator</p>
                        <div className="mt-3 inline-block bg-purple-800 rounded-full px-3 py-1">
                            <span className="text-pink-400 text-sm">3 Free Credits Daily</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-900/50 border border-red-700 rounded-lg p-3">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-purple-900/50 text-white placeholder-purple-400 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Email address"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-purple-900/50 text-white placeholder-purple-400 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Password"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-all disabled:opacity-50"
                        >
                            {loading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
                        </button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-purple-700"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-purple-950 text-purple-400 rounded">OR CONTINUE WITH</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-purple-900/50 text-white font-semibold hover:bg-purple-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 border border-purple-700"
                        >
                            <GoogleIcon /> Google
                        </button>

                        <p className="text-center text-purple-400 text-sm mt-6">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                className="text-pink-400 hover:text-pink-300 font-medium"
                            >
                                {isLogin ? "Sign Up" : "Sign In"}
                            </button>
                        </p>
                    </form>
                </div>
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
            <div className="flex h-screen bg-purple-950">
                {/* Sidebar */}
                <div className="w-72 bg-purple-950 border-r border-purple-800 flex flex-col">
                    <div className="p-6 border-b border-purple-800">
                        <img src={logoImage} alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-3 shadow-lg" />
                        <h1 className="text-xl font-bold text-center text-white">
                            {t.appTitle}
                        </h1>
                        <p className="text-xs text-purple-400 text-center mt-1">{t.tagline}</p>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2">
                        <button onClick={() => setActiveTab("home")} className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === "home" ? "bg-purple-700 text-white" : "text-purple-300 hover:bg-purple-800"}`}>
                            <HomeIcon /> {t.home}
                        </button>
                        <button onClick={() => { setActiveTab("podcasts"); fetchUserPodcasts(session?.access_token); }} className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === "podcasts" ? "bg-purple-700 text-white" : "text-purple-300 hover:bg-purple-800"}`}>
                            <PodcastIcon /> {t.yourPodcasts}
                        </button>
                    </nav>
                    
                    <div className="p-4 border-t border-purple-800 space-y-3">
                        <CreditDisplay credits={credits} creditsUsed={creditsUsedToday} dailyLimit={dailyLimit} resetsInSeconds={resetsInSeconds} language={language} />
                        <div className="flex gap-2">
                            <button onClick={() => setLanguage('en')} className={`flex-1 px-3 py-2 text-sm rounded-xl transition-all ${language === 'en' ? 'bg-purple-700 text-white' : 'bg-purple-900 text-purple-300 hover:bg-purple-800'}`}>English</button>
                            <button onClick={() => setLanguage('hi')} className={`flex-1 px-3 py-2 text-sm rounded-xl transition-all ${language === 'hi' ? 'bg-purple-700 text-white' : 'bg-purple-900 text-purple-300 hover:bg-purple-800'}`}>हिंदी</button>
                        </div>
                        <button onClick={handleLogout} className="w-full px-4 py-2 rounded-xl bg-red-900/30 text-red-400 hover:bg-red-800/50 transition-all text-sm font-medium flex items-center justify-center gap-2 border border-red-800">
                            <LogoutIcon /> {t.logout}
                        </button>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto px-6 py-8">
                        {activeTab === "home" && (
                            <>
                                {credits > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-purple-900/30 backdrop-blur-sm rounded-2xl border border-purple-800 p-8 mb-8">
                                        <label className="block text-white font-semibold mb-2">{t.topicLabel}</label>
                                        <div className="flex gap-3">
                                            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generatePodcast()} disabled={isGenerating} placeholder={t.topicPlaceholder} className="flex-1 px-5 py-3 rounded-xl bg-purple-950 text-white placeholder-purple-400 border border-purple-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                                            <button onClick={generatePodcast} disabled={!topic.trim() || isGenerating || credits <= 0} className={`px-8 py-3 rounded-xl font-semibold transition-all shadow-md ${!topic.trim() || isGenerating || credits <= 0 ? 'bg-purple-800 text-purple-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-500 hover:shadow-lg'}`}>
                                                {isGenerating ? t.generating : t.generateButton}
                                            </button>
                                        </div>
                                        <div className="mt-5">
                                            <p className="text-xs text-purple-400 mb-2">{t.tryThese}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {["AI in Healthcare", "Future of Space Travel", "Climate Solutions", "Digital Art Revolution", "Quantum Computing", "Mars Colonization"].map((sample, idx) => (
                                                    <button key={idx} onClick={() => setTopic(sample)} className="px-3 py-1.5 bg-purple-800 hover:bg-purple-700 text-purple-300 hover:text-white rounded-full text-sm transition-colors">{sample}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {credits <= 0 && !isGenerating && !podcast && (
                                    <div className="bg-yellow-900/30 border border-yellow-800 rounded-2xl p-8 text-center">
                                        <div className="text-6xl mb-4">⚠️</div>
                                        <h3 className="text-xl font-semibold text-yellow-400 mb-2">{t.dailyLimitReached}</h3>
                                        <p className="text-yellow-300">{t.outOfCredits.replace('{limit}', dailyLimit)}</p>
                                    </div>
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
                                    <div className="bg-red-900/30 border border-red-800 rounded-2xl p-4 text-center mt-4">
                                        <p className="text-red-400">{error}</p>
                                        <button onClick={() => setError(null)} className="mt-2 text-sm text-red-500 underline">Dismiss</button>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {activeTab === "podcasts" && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white">{t.yourPodcasts}</h2>
                                {loadingPodcasts && <div className="text-center py-12 text-purple-400">{t.loading}</div>}
                                {!loadingPodcasts && userPodcasts.length === 0 && (
                                    <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-12 text-center border border-purple-800">
                                        <p className="text-purple-300">{t.noPodcasts}</p>
                                        <button onClick={() => setActiveTab("home")} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all">{t.newPodcast}</button>
                                    </div>
                                )}
                                {userPodcasts.length > 0 && (
                                    <div className="grid gap-4">
                                        {userPodcasts.map(podcast => (
                                            <PodcastCard key={podcast.job_id} podcast={podcast} onPlay={playPodcast} onDelete={deletePodcast} language={language} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}