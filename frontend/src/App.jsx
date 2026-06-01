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

// --- Professional SVG Icons (No Emojis) ---
const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const PodcastIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C10.6868 2 9.38642 2.25866 8.17317 2.7612C6.95991 3.26375 5.85752 4.00035 4.92893 4.92893C3.05357 6.8043 2 9.34784 2 12C2 14.6522 3.05357 17.1957 4.92893 19.0711C5.85752 19.9997 6.95991 20.7362 8.17317 21.2388C9.38642 21.7413 10.6868 22 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 12V17" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 14C16 14.5304 15.7893 15.0391 15.4142 15.4142C15.0391 15.7893 14.5304 16 14 16" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 14C8 14.5304 8.21071 15.0391 8.58579 15.4142C8.96086 15.7893 9.46957 16 10 16" stroke="currentColor" strokeWidth="2"/>
        <path d="M18 11C18 12.5913 17.3679 14.1174 16.2426 15.2426C15.1174 16.3679 13.5913 17 12 17" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 11C6 12.5913 6.63214 14.1174 7.75736 15.2426C8.88258 16.3679 10.4087 17 12 17" stroke="currentColor" strokeWidth="2"/>
        <circle cx="19" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 21L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const LogoutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18" />
        <path d="M6 6L18 18" />
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
        
        .sidebar-scroll::-webkit-scrollbar {
            width: 6px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-track {
            background: #f3e8ff;
            border-radius: 3px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb {
            background: #c084fc;
            border-radius: 3px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: #a855f7;
        }
        
        .thinking-process-scroll::-webkit-scrollbar {
            width: 6px;
        }
        
        .thinking-process-scroll::-webkit-scrollbar-track {
            background: #4c1d95;
            border-radius: 3px;
        }
        
        .thinking-process-scroll::-webkit-scrollbar-thumb {
            background: #a855f7;
            border-radius: 3px;
        }
        
        @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
            animation: gradient-shift 3s ease infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.2); }
            50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.4); }
        }
        
        .animate-glow {
            animation: glow 3s ease-in-out infinite;
        }
        
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
            animation: spin-slow 1s linear infinite;
        }
        
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
        }
        
        .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .bg-grid-pattern {
            background-image: radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.1) 1px, transparent 1px);
            background-size: 32px 32px;
        }
    `}</style>
);

// --- Documentation Footer Component (at bottom of generation page) ---
const DocumentationFooter = ({ language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const t = translations[language];
    
    const workflowSteps = [
        { step: "1", title: "User Input", description: "User provides topic and language preference", icon: "🎯", color: "pink" },
        { step: "2", title: "Planning", description: "LLM analyzes topic, extracts keywords and subtopics", icon: "📋", color: "purple" },
        { step: "3", title: "Research", description: "Tavily API performs real-time web search", icon: "🔍", color: "indigo" },
        { step: "4", title: "Interview", description: "Multi-turn dialogue between host and expert", icon: "🎙️", color: "violet" },
        { step: "5", title: "Writing", description: "Convert conversation to natural dialogue", icon: "✍️", color: "fuchsia" },
        { step: "6", title: "Audio Synthesis", description: "Google Cloud TTS generates neural voices", icon: "🎧", color: "purple" },
        { step: "7", title: "Final Output", description: "MP3 audio with captions and transcript", icon: "✨", color: "pink" }
    ];
    
    return (
        <div className="mt-12 pt-8 border-t border-purple-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group w-full flex items-center justify-between py-4 px-6 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl transition-all duration-300"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-glow">
                        <DocumentationIcon />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-800">{t.documentation}</h3>
                        <p className="text-xs text-gray-500">Complete system architecture and API guide</p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-purple-500"
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
                        <div className="mt-4 p-6 bg-white rounded-2xl border border-purple-200 shadow-xl">
                            {/* Architecture Section */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm">🏗️</span>
                                    {t.architecture}
                                </h4>
                                <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-xl p-5 overflow-x-auto">
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
                            
                            {/* Workflow Steps */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm">🔄</span>
                                    {t.workflowDiagram}
                                </h4>
                                <div className="grid gap-3">
                                    {workflowSteps.map((step, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                {step.step}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-semibold text-gray-800">{step.title}</h5>
                                                <p className="text-xs text-gray-600">{step.description}</p>
                                            </div>
                                            <div className="text-2xl">{step.icon}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* API Endpoints */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm">🔌</span>
                                    {t.apiEndpoints}
                                </h4>
                                <div className="grid gap-2">
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <code className="text-sm font-mono text-purple-600 font-semibold">POST /generate-podcast</code>
                                        <p className="text-xs text-gray-600 mt-1">Starts podcast generation. Returns job_id for progress tracking.</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <code className="text-sm font-mono text-pink-600 font-semibold">GET /stream-progress/{'{job_id}'}</code>
                                        <p className="text-xs text-gray-600 mt-1">Server-Sent Events endpoint for real-time progress updates.</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <code className="text-sm font-mono text-purple-600 font-semibold">GET /user/credits</code>
                                        <p className="text-xs text-gray-600 mt-1">Returns daily credit usage and remaining credits.</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <code className="text-sm font-mono text-pink-600 font-semibold">GET /user/podcasts</code>
                                        <p className="text-xs text-gray-600 mt-1">Returns user's podcast history.</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="pt-6 text-center border-t border-purple-200">
                                <p className="text-purple-600 font-semibold">Built with LangGraph, Groq, Google Cloud TTS & Supabase</p>
                                <p className="text-sm text-gray-500 mt-1">Developed by Aditya Jain</p>
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
        <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl mb-6">
            <button
                onClick={onToggle}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between hover:opacity-90 transition-all"
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
                                    className="mb-3 pb-2 border-b border-purple-800 last:border-0"
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

// --- Audio Player Component ---
const AudioPlayerWithCaptions = ({ audioUrl, script, onDownload, onNewPodcast }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentCaption, setCurrentCaption] = useState("");
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    const cleanScript = script ? script.replace(/<[^>]*>/g, '') : "";
    const lines = cleanScript.split('\n');
    const dialogueLines = lines.filter(line => line.includes('**Interviewer:**') || line.includes('**Expert:**'));
    
    const updateCaption = (time) => {
        const estimatedLineIndex = Math.floor((time / duration) * dialogueLines.length);
        if (dialogueLines[estimatedLineIndex] && dialogueLines[estimatedLineIndex] !== currentCaption) {
            setCurrentCaption(dialogueLines[estimatedLineIndex].replace(/\*\*/g, ''));
        }
    };
    
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            updateCaption(audioRef.current.currentTime);
        }
    };
    
    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
        updateCaption(time);
    };
    
    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <span>🎧</span> Now Playing
                </h3>
            </div>
            
            <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />
            
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { if(audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }} className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600 flex items-center justify-center transition-all">
                            <RewindIcon />
                        </button>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button onClick={() => { if(audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10); }} className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600 flex items-center justify-center transition-all">
                            <ForwardIcon />
                        </button>
                        <div className="ml-2">
                            <h4 className="font-bold text-gray-800">AI-Generated Podcast</h4>
                            <p className="text-xs text-gray-500">Dynamic AI conversation</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onNewPodcast} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700 transition-all flex items-center gap-2 text-sm">
                            <NewIcon /> New
                        </button>
                        <button onClick={onDownload} className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 transition-all flex items-center gap-2 text-sm">
                            <DownloadIcon /> Download
                        </button>
                    </div>
                </div>
                
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-gray-500 font-mono">{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                        <span className="text-xs text-gray-500 font-mono">{formatTime(duration)}</span>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 min-h-[100px] border border-purple-100">
                    {currentCaption ? (
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                                {currentCaption.includes('Interviewer') ? '🎙️ Interviewer' : '👨‍💻 Expert'}
                            </span>
                            <p className="text-gray-700 mt-2 leading-relaxed">
                                {currentCaption.replace('Interviewer:', '').replace('Expert:', '').trim()}
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center">🎙️ Captions will appear here as the podcast plays...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Transcript Viewer ---
const TranscriptViewer = ({ script }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const cleanScript = script ? script.replace(/<[^>]*>/g, '') : "";

    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 overflow-hidden">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 flex items-center justify-between hover:from-purple-100 hover:to-pink-100 transition-all">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">📄 Full Transcript</h3>
                <span className="text-gray-400">{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="p-6 max-h-[400px] overflow-y-auto bg-gray-50">
                            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {cleanScript.split('\n').map((line, i) => {
                                    if (line.includes('**Interviewer:**')) return <p key={i} className="mt-3 font-semibold text-purple-700">🎙️ {line.replace(/\*\*/g, '')}</p>;
                                    if (line.includes('**Expert:**')) return <p key={i} className="mt-2 font-semibold text-pink-600">👨‍💻 {line.replace(/\*\*/g, '')}</p>;
                                    if (line.trim()) return <p key={i} className="text-gray-600">{line}</p>;
                                    return <br key={i} />;
                                })}
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
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-bold text-purple-700">{credits}</div>
                    <div className="text-xs text-gray-600">{t.creditsLeft}</div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">{creditsUsed}/{dailyLimit} {t.usedToday}</div>
                    {credits === 0 && timeRemaining > 0 && (
                        <div className="text-xs text-orange-600">Resets in {formatTime(timeRemaining)}</div>
                    )}
                </div>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${(creditsUsed / dailyLimit) * 100}%` }} />
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
        <div className="bg-white rounded-xl border border-purple-200 p-4 hover:shadow-xl transition-all duration-300 hover:border-purple-300">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 flex-1">{podcast.topic}</h3>
                <button onClick={() => onDelete(podcast.job_id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <DeleteIcon />
                </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">{date}</p>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{podcast.script_preview}</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => { if(audioRef.current) { if(isPlaying) audioRef.current.pause(); else audioRef.current.play(); setIsPlaying(!isPlaying); } }} className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-md transition-all">
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <audio ref={audioRef} src={podcast.audio_url} onEnded={() => setIsPlaying(false)} />
                    <button onClick={() => window.open(podcast.audio_url, '_blank')} className="text-gray-500 hover:text-purple-600 transition-colors">
                        <DownloadIcon />
                    </button>
                </div>
                <button onClick={() => onPlay(podcast)} className="text-sm text-purple-600 hover:text-pink-600 font-medium transition-colors">
                    {t.play} →
                </button>
            </div>
        </div>
    );
};

// --- Authentication Component ---
const AuthScreen = ({ onAuth, setSession, backendStatus }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const t = translations.en;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!backendStatus.isConnected) { setError(t.errors.backendOffline); return; }
        setLoading(true);
        setError(null);
        try {
            let result;
            if (isLogin) result = await supabase.auth.signInWithPassword({ email, password });
            else result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
            if (result.error) throw result.error;
            if (result.data.session) { setSession(result.data.session); onAuth(true); }
            else if (result.data.user && !isLogin) setError("Check your email for confirmation link.");
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
            
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                    <div className={`mb-4 text-center text-sm ${backendStatus.isConnected ? 'text-green-300' : 'text-red-300'}`}>
                        {backendStatus.isConnected ? '✓ Backend connected' : '⚠ Backend offline'}
                    </div>
                    <div className="text-center mb-8">
                        <img src={logoImage} alt="Logo" className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg object-cover animate-float" />
                        <h1 className="text-3xl font-bold text-white mb-2">Podcast Studio</h1>
                        <p className="text-purple-200">AI-Powered Podcast Generator</p>
                        <div className="mt-3 inline-block bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-3 py-1">
                            <span className="text-white text-sm">3 Free Credits Daily</span>
                        </div>
                    </div>
                    {error && <div className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3"><p className="text-red-200 text-sm">{error}</p></div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Email" required disabled={!backendStatus.isConnected} />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Password" required disabled={!backendStatus.isConnected} />
                        <button type="submit" disabled={loading || !backendStatus.isConnected} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                            {loading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
                        </button>
                        <p className="text-center text-purple-200 text-sm mt-4">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-white underline">
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
    const [backendStatus, setBackendStatus] = useState({ isConnected: false, checking: true });
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
            const response = await fetch(`${BACKEND_URL}/`, { method: 'GET', signal: AbortSignal.timeout(10000) });
            if (response.ok) { setBackendStatus({ isConnected: true, checking: false }); return true; }
            throw new Error("Backend not responding");
        } catch (err) { setBackendStatus({ isConnected: false, checking: false }); return false; }
    };

    useEffect(() => { checkBackendConnection(); }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && backendStatus.isConnected) {
                setSession(session);
                setIsAuthenticated(true);
                fetchUserCredits(session.access_token);
                fetchUserPodcasts(session.access_token);
            }
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session && backendStatus.isConnected) {
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
    }, [backendStatus.isConnected]);

    const fetchUserCredits = async (token) => {
        if (!backendStatus.isConnected) return;
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
        setPodcast({ audioUrl: podcastData.audio_url, script: "Loading...", topic: podcastData.topic, jobId: podcastData.job_id });
        fetch(`${BACKEND_URL}/user/podcasts/${podcastData.job_id}`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } })
            .then(res => res.json())
            .then(data => setPodcast({ audioUrl: data.audio_url, script: data.script, topic: data.topic, jobId: data.job_id }));
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

    if (backendStatus.checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin-slow mx-auto mb-4"></div>
                    <p className="text-white text-lg">Connecting to backend...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthScreen onAuth={setIsAuthenticated} setSession={setSession} backendStatus={backendStatus} />;
    }

    return (
        <>
            <GlobalStyles />
            <div className="flex h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
                {/* Sidebar - Pink/Purple Theme */}
                <div className="w-72 bg-white/80 backdrop-blur-sm border-r border-purple-200 flex flex-col shadow-xl">
                    <div className="p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                        <img src={logoImage} alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-3 shadow-lg animate-float" />
                        <h1 className="text-xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {t.appTitle}
                        </h1>
                        <p className="text-xs text-gray-500 text-center mt-1">{t.tagline}</p>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2">
                        <button onClick={() => setActiveTab("home")} className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === "home" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : "text-gray-700 hover:bg-purple-100"}`}>
                            <HomeIcon /> {t.home}
                        </button>
                        <button onClick={() => { setActiveTab("podcasts"); fetchUserPodcasts(session?.access_token); }} className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === "podcasts" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : "text-gray-700 hover:bg-purple-100"}`}>
                            <PodcastIcon /> {t.yourPodcasts}
                        </button>
                    </nav>
                    
                    <div className="p-4 border-t border-purple-200 space-y-3">
                        <CreditDisplay credits={credits} creditsUsed={creditsUsedToday} dailyLimit={dailyLimit} resetsInSeconds={resetsInSeconds} language={language} />
                        <div className="flex gap-2">
                            <button onClick={() => setLanguage('en')} className={`flex-1 px-3 py-2 text-sm rounded-xl transition-all ${language === 'en' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-100'}`}>English</button>
                            <button onClick={() => setLanguage('hi')} className={`flex-1 px-3 py-2 text-sm rounded-xl transition-all ${language === 'hi' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-100'}`}>हिंदी</button>
                        </div>
                        <button onClick={handleLogout} className="w-full px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all text-sm font-medium flex items-center justify-center gap-2">
                            <LogoutIcon /> {t.logout}
                        </button>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto px-6 py-8">
                        {!backendStatus.isConnected && (
                            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <p className="text-yellow-800 text-sm">⚠️ Backend offline. <button onClick={() => checkBackendConnection()} className="underline">Retry</button></p>
                            </div>
                        )}
                        
                        {activeTab === "home" && (
                            <>
                                {credits > 0 && backendStatus.isConnected && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl border border-purple-200 p-8 mb-8">
                                        <label className="block text-gray-700 font-semibold mb-2">{t.topicLabel}</label>
                                        <div className="flex gap-3">
                                            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generatePodcast()} disabled={isGenerating || !backendStatus.isConnected} placeholder={t.topicPlaceholder} className="flex-1 px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                                            <button onClick={generatePodcast} disabled={!topic.trim() || isGenerating || credits <= 0 || !backendStatus.isConnected} className={`px-8 py-3 rounded-xl font-semibold transition-all shadow-md ${!topic.trim() || isGenerating || credits <= 0 || !backendStatus.isConnected ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105'}`}>
                                                {isGenerating ? t.generating : t.generateButton}
                                            </button>
                                        </div>
                                        <div className="mt-5">
                                            <p className="text-xs text-gray-400 mb-2">{t.tryThese}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {["AI in Healthcare", "Future of Space Travel", "Climate Solutions", "Digital Art Revolution", "Quantum Computing", "Mars Colonization"].map((sample, idx) => (
                                                    <button key={idx} onClick={() => setTopic(sample)} className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-full text-sm transition-colors">{sample}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {credits <= 0 && backendStatus.isConnected && !isGenerating && !podcast && (
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-8 text-center">
                                        <div className="text-6xl mb-4">⚠️</div>
                                        <h3 className="text-xl font-semibold text-yellow-800 mb-2">{t.dailyLimitReached}</h3>
                                        <p className="text-yellow-700">{t.outOfCredits.replace('{limit}', dailyLimit)}</p>
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

                                {/* Documentation Footer - at bottom of generation page */}
                                <DocumentationFooter language={language} />

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mt-4">
                                        <p className="text-red-600">{error}</p>
                                        <button onClick={() => setError(null)} className="mt-2 text-sm text-red-500 underline">Dismiss</button>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {activeTab === "podcasts" && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t.yourPodcasts}</h2>
                                {loadingPodcasts && <div className="text-center py-12 text-gray-500">{t.loading}</div>}
                                {!loadingPodcasts && userPodcasts.length === 0 && (
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-12 text-center">
                                        <p className="text-gray-500">{t.noPodcasts}</p>
                                        <button onClick={() => setActiveTab("home")} className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all">{t.newPodcast}</button>
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