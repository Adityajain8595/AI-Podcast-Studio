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
const PlaySVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 3L19 12L5 21V3Z" />
    </svg>
);

const PauseSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </svg>
);

const DownloadSVG = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
    </svg>
);

const DeleteSVG = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

// --- Global Inline Styles ---
const GlobalStyles = () => (
    <style>{`
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    `}</style>
);

// --- Credit Display Component ---
const CreditDisplay = ({ credits, creditsUsed, dailyLimit, resetsInSeconds, language }) => {
    const [timeRemaining, setTimeRemaining] = useState(resetsInSeconds);
    const t = translations[language];
    
    useEffect(() => {
        if (resetsInSeconds <= 0) return;
        const timer = setInterval(() => {
            setTimeRemaining(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resetsInSeconds]);
    
    const formatTimeRemaining = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };
    
    const percentUsed = (creditsUsed / dailyLimit) * 100;
    
    return (
        <div className={`px-3 py-1.5 rounded-lg ${credits > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="flex items-center gap-2">
                <div className="text-center">
                    <div className={`text-xl font-bold ${credits > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {credits}
                    </div>
                    <div className="text-xs text-gray-600">{t.creditsLeft}</div>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div>
                    <div className="text-xs font-medium text-gray-700">
                        {creditsUsed}/{dailyLimit} {t.usedToday}
                    </div>
                    {credits === 0 && timeRemaining > 0 && (
                        <div className="text-xs text-orange-600">
                            Resets in {formatTimeRemaining(timeRemaining)}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                <div 
                    className={`h-1 rounded-full transition-all duration-500 ${credits === 0 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${percentUsed}%` }}
                />
            </div>
        </div>
    );
};

// --- Documentation Dropdown Component (moved from sidebar) ---
const DocumentationDropdown = ({ language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const t = translations[language];
    
    const workflowSteps = [
        { step: "1", title: "User Input", description: "User provides topic and language preference", icon: "📝" },
        { step: "2", title: "Planning Stage", description: "LLM analyzes topic and extracts keywords", icon: "📋" },
        { step: "3", title: "Research Stage", description: "Tavily API performs real-time web search", icon: "🔍" },
        { step: "4", title: "Interview Simulation", description: "Multi-turn dialogue between host and expert", icon: "🎙️" },
        { step: "5", title: "Script Writing", description: "Convert conversation to natural dialogue", icon: "✍️" },
        { step: "6", title: "Audio Synthesis", description: "Google Cloud TTS generates neural voices", icon: "🔊" },
        { step: "7", title: "Final Output", description: "MP3 audio with captions and transcript", icon: "✅" }
    ];
    
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
                📚 {t.documentation} <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
            </button>
            
            {isOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-y-auto">
                    <div className="p-4">
                        <h4 className="font-bold text-gray-800 mb-3">System Overview</h4>
                        <div className="text-xs text-gray-600 space-y-3">
                            <div>
                                <p className="font-semibold text-gray-700 mb-1">Workflow Steps:</p>
                                <div className="space-y-2">
                                    {workflowSteps.map((step, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <span className="text-base min-w-[24px]">{step.icon}</span>
                                            <div>
                                                <p className="font-medium text-gray-700">Step {step.step}: {step.title}</p>
                                                <p className="text-gray-500">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <hr className="my-2" />
                            <div>
                                <p className="font-semibold text-gray-700 mb-1">API Endpoints:</p>
                                <code className="block text-xs bg-gray-100 p-1 rounded">POST /generate-podcast</code>
                                <code className="block text-xs bg-gray-100 p-1 rounded mt-1">GET /stream-progress/{'{job_id}'}</code>
                                <code className="block text-xs bg-gray-100 p-1 rounded mt-1">GET /user/credits</code>
                                <code className="block text-xs bg-gray-100 p-1 rounded mt-1">GET /user/podcasts</code>
                            </div>
                            <hr className="my-2" />
                            <div>
                                <p className="font-semibold text-gray-700 mb-1">Tech Stack:</p>
                                <p>React + FastAPI + LangGraph + Groq + Google TTS + Supabase</p>
                                <p className="text-purple-600 mt-2">Developed by Aditya Jain</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Simple Audio Player Component ---
const SimpleAudioPlayer = ({ audioUrl, onDownload }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    
    return (
        <div className="flex items-center gap-3">
            <button 
                onClick={() => {
                    if (audioRef.current) {
                        if (isPlaying) audioRef.current.pause();
                        else audioRef.current.play();
                        setIsPlaying(!isPlaying);
                    }
                }} 
                className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors"
            >
                {isPlaying ? <PauseSVG /> : <PlaySVG />}
            </button>
            <audio 
                ref={audioRef} 
                src={audioUrl} 
                onEnded={() => setIsPlaying(false)} 
            />
            <button 
                onClick={onDownload} 
                className="text-gray-600 hover:text-purple-600 transition-colors"
            >
                <DownloadSVG />
            </button>
        </div>
    );
};

// --- Podcast Card Component ---
const PodcastCard = ({ podcast, onPlay, onDelete, language }) => {
    const t = translations[language];
    const date = new Date(podcast.created_at).toLocaleDateString();
    
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 flex-1 text-sm">
                    {podcast.topic.length > 60 ? podcast.topic.substring(0, 60) + '...' : podcast.topic}
                </h3>
                <button 
                    onClick={() => onDelete(podcast.job_id)} 
                    className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                >
                    <DeleteSVG />
                </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">{date}</p>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {podcast.script_preview}
            </p>
            <div className="flex items-center justify-between">
                <SimpleAudioPlayer 
                    audioUrl={podcast.audio_url} 
                    onDownload={() => window.open(podcast.audio_url, '_blank')} 
                />
                <button 
                    onClick={() => onPlay(podcast)} 
                    className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                >
                    {t.play} →
                </button>
            </div>
        </div>
    );
};

// --- Generation Panel Component ---
const GenerationPanel = ({ topic, setTopic, isGenerating, credits, onGenerate, t, backendStatus }) => (
    <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-8 mb-8">
        <label className="block text-gray-700 font-semibold mb-2">{t.topicLabel}</label>
        <div className="flex gap-3">
            <input 
                type="text" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && onGenerate()} 
                disabled={isGenerating || !backendStatus.isConnected} 
                placeholder={t.topicPlaceholder} 
                className="flex-1 px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
            />
            <button 
                onClick={onGenerate} 
                disabled={!topic.trim() || isGenerating || credits <= 0 || !backendStatus.isConnected} 
                className={`px-8 py-3 rounded-xl font-semibold transition-all shadow-md ${
                    !topic.trim() || isGenerating || credits <= 0 || !backendStatus.isConnected 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105'
                }`}
            >
                {isGenerating ? t.generating : t.generateButton}
            </button>
        </div>
        
        <div className="mt-5">
            <p className="text-xs text-gray-400 mb-2">{t.tryThese}</p>
            <div className="flex flex-wrap gap-2">
                {["The DB Cooper Mystery", "Future of Quantum Computing", "Climate Change Solutions", "AI in Healthcare", "Mars Colonization", "Ancient Civilizations"].map((sample, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setTopic(sample)} 
                        className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-full text-sm transition-colors"
                    >
                        {sample}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
            <DocumentationDropdown language={t === translations.en ? 'en' : 'hi'} />
        </div>
    </div>
);

// --- Collapsible Thinking Process Component ---
const CollapsibleThinkingProcess = ({ logs, isComplete, language, onToggle, isExpanded }) => {
    const t = translations[language];
    const logsEndRef = useRef(null);

    useEffect(() => {
        if (isExpanded) {
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, isExpanded]);

    const getStepIcon = (log) => {
        if (log.status === 'error') return '❌';
        if (log.status === 'success' || log.status === 'complete') return '✅';
        if (log.step === 'planning') return '📋';
        if (log.step === 'research') return '🔍';
        if (log.step === 'interview') return '🎙️';
        if (log.step === 'writing') return '✍️';
        if (log.step === 'tts') return '🔊';
        if (log.status === 'started') return '🚀';
        return '⚡';
    };

    return (
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl mb-6">
            <button
                onClick={onToggle}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 flex items-center justify-between hover:opacity-90 transition-opacity"
            >
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${isComplete ? 'bg-green-400' : 'bg-yellow-400'} rounded-full animate-pulse`}></div>
                    <h3 className="text-white font-semibold text-sm tracking-wide">
                        {isComplete ? "✓ " + t.thinkingProcess + " Complete" : "🎙️ " + t.thinkingProcess}
                    </h3>
                </div>
                <div className="flex items-center gap-2 text-white">
                    <span className="text-sm">{isExpanded ? '▲' : '▼'}</span>
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
                        <div className="h-64 overflow-y-auto p-4 font-mono text-sm">
                            {logs.map((log, idx) => (
                                <motion.div
                                    key={`${log.timestamp}-${idx}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                                    className={`mb-2 pb-2 border-b border-gray-800 last:border-0 ${
                                        log.status === 'error' ? 'text-red-400' : 'text-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-base min-w-[28px]">{getStepIcon(log)}</span>
                                        <div className="flex-1">
                                            <span className="text-purple-400 text-xs mr-2">
                                                {log.timestamp ? new Date(log.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString()}
                                            </span>
                                            <span className="text-sm">{log.message}</span>
                                        </div>
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

// --- Transcript Viewer ---
const TranscriptViewer = ({ script }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const cleanScript = script ? script.replace(/<[^>]*>/g, '') : "";

    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full bg-gradient-to-r from-gray-50 to-purple-50 px-6 py-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
            >
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span>📄</span> Full Transcript
                </h3>
                <span className="text-gray-400">{isExpanded ? '▼' : '▲'}</span>
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
                        <div className="p-6 max-h-[400px] overflow-y-auto bg-gray-50">
                            <div className="text-gray-700 font-sans text-sm leading-relaxed">
                                <ReactMarkdown>{cleanScript}</ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Audio Player with Captions ---
const AudioPlayerWithCaptions = ({ audioUrl, script, onDownload, onNewPodcast }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <span>🎧</span> Now Playing
                </h3>
            </div>

            <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
            />

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all"
                        >
                            {isPlaying ? <PauseSVG /> : <PlaySVG />}
                        </button>
                        <div>
                            <h4 className="font-bold text-gray-800">AI-Generated Podcast</h4>
                            <p className="text-sm text-gray-500">Dynamic conversation with AI experts</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onNewPodcast} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm">
                            <span>✨</span> New
                        </button>
                        <button onClick={onDownload} className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-2 text-sm">
                            <DownloadSVG /> Download
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 min-h-[100px]">
                    <p className="text-gray-400 text-center">
                        🎙️ Audio player ready. Click play to listen to your podcast...
                    </p>
                </div>
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
        if (!backendStatus.isConnected) {
            setError(t.errors.backendOffline);
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            let result;
            if (isLogin) {
                result = await supabase.auth.signInWithPassword({ email, password });
            } else {
                result = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: { emailRedirectTo: window.location.origin }
                });
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            </div>
            
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl"
                >
                    <div className={`mb-4 text-center text-sm ${backendStatus.isConnected ? 'text-green-300' : 'text-red-300'}`}>
                        {backendStatus.isConnected ? '✓ Backend connected' : '⚠ Backend offline - Please wait'}
                    </div>
                    
                    <div className="text-center mb-8">
                        <img 
                            src={logoImage} 
                            alt="Podcast Studio Logo" 
                            className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg object-cover"
                        />
                        <h1 className="text-3xl font-bold text-white mb-2">Podcast Studio</h1>
                        <p className="text-purple-200">AI-Powered Podcast Generator</p>
                        <div className="mt-3 inline-block bg-purple-500/30 rounded-full px-3 py-1">
                            <span className="text-yellow-300 text-sm">3 Free Credits Daily</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3">
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="you@example.com"
                                required
                                disabled={!backendStatus.isConnected}
                            />
                        </div>
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="••••••••"
                                required
                                disabled={!backendStatus.isConnected}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !backendStatus.isConnected}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
                        </button>

                        <p className="text-center text-purple-200 text-sm mt-4">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                }}
                                className="text-white underline hover:no-underline"
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
            const response = await fetch(`${BACKEND_URL}/`, {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });
            if (response.ok) {
                setBackendStatus({ isConnected: true, checking: false });
                return true;
            }
            throw new Error("Backend not responding");
        } catch (err) {
            setBackendStatus({ isConnected: false, checking: false });
            return false;
        }
    };

    useEffect(() => {
        checkBackendConnection();
    }, []);

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

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, []);

    const fetchUserCredits = async (token) => {
        if (!backendStatus.isConnected) return;
        try {
            const response = await fetch(`${BACKEND_URL}/user/credits`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCredits(data.credits_remaining);
                setCreditsUsedToday(data.credits_used_today);
                setDailyLimit(data.daily_limit);
                setResetsInSeconds(data.resets_in_seconds);
            }
        } catch (err) {
            console.error("Failed to fetch credits:", err);
        }
    };

    const fetchUserPodcasts = async (token) => {
        setLoadingPodcasts(true);
        try {
            const response = await fetch(`${BACKEND_URL}/user/podcasts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUserPodcasts(data.podcasts);
            }
        } catch (err) {
            console.error("Failed to fetch podcasts:", err);
        } finally {
            setLoadingPodcasts(false);
        }
    };

    const deletePodcast = async (jobId) => {
        try {
            await fetch(`${BACKEND_URL}/user/podcasts/${jobId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            setUserPodcasts(prev => prev.filter(p => p.job_id !== jobId));
        } catch (err) {
            console.error("Failed to delete podcast:", err);
        }
    };

    const playPodcast = (podcastData) => {
        setPodcast({
            audioUrl: podcastData.audio_url,
            script: "Loading...",
            topic: podcastData.topic,
            jobId: podcastData.job_id
        });
        fetch(`${BACKEND_URL}/user/podcasts/${podcastData.job_id}`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        })
            .then(res => res.json())
            .then(data => {
                setPodcast({
                    audioUrl: data.audio_url,
                    script: data.script,
                    topic: data.topic,
                    jobId: data.job_id
                });
            });
        setActiveTab("home");
    };

    const generatePodcast = async () => {
        if (!topic.trim() || credits <= 0) return;

        setIsGenerating(true);
        setGenerationLogs([{ 
            step: 'start', 
            status: 'started', 
            message: `Starting podcast generation for: "${topic}"...`,
            timestamp: Date.now() / 1000
        }]);

        try {
            const startRes = await fetch(`${BACKEND_URL}/generate-podcast`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic: topic,
                    language: language,
                    speaker_voices: { "Interviewer": "male", "Expert": "female" }
                })
            });

            if (!startRes.ok) {
                const errorData = await startRes.json();
                throw new Error(errorData.detail || "Generation failed");
            }
            
            const { job_id, credits_remaining } = await startRes.json();
            setCredits(credits_remaining);
            setCreditsUsedToday(prev => prev + 1);

            eventSourceRef.current = new EventSource(`${BACKEND_URL}/stream-progress/${job_id}`);

            eventSourceRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'progress') {
                        if (isMounted.current) {
                            setGenerationLogs(prev => {
                                const exists = prev.some(log => 
                                    log.message === data.data.message && 
                                    Math.abs((log.timestamp || 0) - (data.data.timestamp || 0)) < 0.5
                                );
                                if (exists) return prev;
                                return [...prev, {
                                    ...data.data,
                                    timestamp: data.data.timestamp || Date.now() / 1000
                                }];
                            });
                        }
                    } else if (data.type === 'complete') {
                        fetch(`${BACKEND_URL}/script/${job_id}`)
                            .then(res => res.json())
                            .then(scriptData => {
                                if (isMounted.current) {
                                    setPodcast({
                                        audioUrl: `${BACKEND_URL}${data.download_url}`,
                                        script: scriptData.script,
                                        topic: topic,
                                        jobId: job_id,
                                        complete: true
                                    });
                                    setIsGenerating(false);
                                    fetchUserPodcasts(session?.access_token);
                                }
                            })
                            .catch(err => {
                                console.error("Error fetching script:", err);
                                if (isMounted.current) {
                                    setError("Failed to fetch the generated script.");
                                    setIsGenerating(false);
                                }
                            });
                        eventSourceRef.current?.close();
                        eventSourceRef.current = null;
                    } else if (data.type === 'error') {
                        if (isMounted.current) {
                            setError(data.message);
                            setIsGenerating(false);
                        }
                        eventSourceRef.current?.close();
                        eventSourceRef.current = null;
                    }
                } catch (err) {
                    console.error("Error parsing SSE message:", err);
                }
            };

            eventSourceRef.current.onerror = () => {
                if (isMounted.current && !podcast) {
                    setError(translations[language].errors.connection);
                    setIsGenerating(false);
                }
                eventSourceRef.current?.close();
                eventSourceRef.current = null;
            };

        } catch (err) {
            console.error("Generation error:", err);
            if (isMounted.current) {
                setError(err.message || translations[language].errors.generation);
                setIsGenerating(false);
            }
            if (eventSourceRef.current) eventSourceRef.current.close();
        }
    };

    const resetAndGenerate = async () => {
        if (!backendStatus.isConnected) {
            setError(translations[language].errors.connection);
            const connected = await checkBackendConnection();
            if (!connected) {
                setError(translations[language].errors.backendOffline);
                return;
            }
        }
        
        if (credits <= 0) {
            setError(`${translations[language].dailyLimitReached}. ${translations[language].outOfCredits.replace('{limit}', dailyLimit)}`);
            return;
        }
        
        if (eventSourceRef.current) eventSourceRef.current.close();
        setPodcast(null);
        setGenerationLogs([]);
        setError(null);
        setIsLogsExpanded(true);
        generatePodcast();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setIsAuthenticated(false);
        setPodcast(null);
        setUserPodcasts([]);
        setTopic("");
        setGenerationLogs([]);
        setError(null);
        if (eventSourceRef.current) eventSourceRef.current.close();
    };

    const t = translations[language];

    if (backendStatus.checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">{t.status.checking}</p>
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
            <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50">
                {/* Menu Bar with Tabs */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                    <div className="p-6 border-b border-gray-200">
                        <img 
                            src={logoImage} 
                            alt="Podcast Studio Logo" 
                            className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
                        />
                        <h1 className="text-xl font-bold text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            {t.appTitle}
                        </h1>
                        <p className="text-xs text-gray-500 text-center mt-1">{t.tagline}</p>
                    </div>
                    
                    <nav className="flex-1 p-4">
                        <button 
                            onClick={() => setActiveTab("home")} 
                            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                                activeTab === "home" 
                                    ? "bg-purple-100 text-purple-700 font-semibold" 
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            🏠 {t.home}
                        </button>
                        <button 
                            onClick={() => {
                                setActiveTab("podcasts");
                                fetchUserPodcasts(session?.access_token);
                            }} 
                            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                                activeTab === "podcasts" 
                                    ? "bg-purple-100 text-purple-700 font-semibold" 
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            🎙️ {t.yourPodcasts}
                        </button>
                    </nav>
                    
                    <div className="p-4 border-t border-gray-200 space-y-3">
                        <CreditDisplay 
                            credits={credits} 
                            creditsUsed={creditsUsedToday} 
                            dailyLimit={dailyLimit} 
                            resetsInSeconds={resetsInSeconds} 
                            language={language} 
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setLanguage('en')} 
                                className={`flex-1 px-2 py-1.5 text-sm rounded ${
                                    language === 'en' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                EN
                            </button>
                            <button 
                                onClick={() => setLanguage('hi')} 
                                className={`flex-1 px-2 py-1.5 text-sm rounded ${
                                    language === 'hi' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                HI
                            </button>
                        </div>
                        <button 
                            onClick={handleLogout} 
                            className="w-full px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                            🚪 {t.logout}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto px-6 py-8">
                        {activeTab === "home" && (
                            <>
                                {!backendStatus.isConnected && (
                                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                        <p className="text-yellow-800 text-sm flex items-center gap-2">
                                            <span>⚠️</span> Backend server is offline.
                                            <button 
                                                onClick={() => checkBackendConnection()} 
                                                className="text-yellow-700 underline"
                                            >
                                                Retry
                                            </button>
                                        </p>
                                    </div>
                                )}
                                
                                <GenerationPanel 
                                    topic={topic}
                                    setTopic={setTopic}
                                    isGenerating={isGenerating}
                                    credits={credits}
                                    onGenerate={resetAndGenerate}
                                    t={t}
                                    backendStatus={backendStatus}
                                />

                                {credits <= 0 && backendStatus.isConnected && !isGenerating && !podcast && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center"
                                    >
                                        <div className="text-6xl mb-4">⚠️</div>
                                        <h3 className="text-xl font-semibold text-yellow-800 mb-2">{t.dailyLimitReached}</h3>
                                        <p className="text-yellow-700">{t.outOfCredits.replace('{limit}', dailyLimit)}</p>
                                        <p className="text-yellow-600 text-sm mt-2">{t.creditsReset}</p>
                                    </motion.div>
                                )}

                                {(isGenerating || generationLogs.length > 0) && generationLogs.length > 0 && (
                                    <CollapsibleThinkingProcess 
                                        logs={generationLogs} 
                                        isComplete={!!podcast && !isGenerating} 
                                        language={language} 
                                        isExpanded={isLogsExpanded} 
                                        onToggle={() => setIsLogsExpanded(!isLogsExpanded)} 
                                    />
                                )}

                                {podcast && !isGenerating && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <AudioPlayerWithCaptions 
                                            audioUrl={podcast.audioUrl} 
                                            script={podcast.script} 
                                            onDownload={() => window.open(podcast.audioUrl, '_blank')} 
                                            onNewPodcast={() => { 
                                                if (eventSourceRef.current) eventSourceRef.current.close(); 
                                                setPodcast(null); 
                                                setTopic(""); 
                                                setGenerationLogs([]); 
                                                setError(null); 
                                                if (session) fetchUserCredits(session.access_token); 
                                            }} 
                                        />
                                        <TranscriptViewer script={podcast.script} />
                                    </motion.div>
                                )}

                                {error && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                                        <p className="text-red-600">{error}</p>
                                        <button onClick={() => setError(null)} className="mt-2 text-sm text-red-500 underline">Dismiss</button>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {activeTab === "podcasts" && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-800">{t.yourPodcasts}</h2>
                                {loadingPodcasts && (
                                    <div className="text-center py-12 text-gray-500">{t.loading}</div>
                                )}
                                {!loadingPodcasts && userPodcasts.length === 0 && (
                                    <div className="bg-gray-50 rounded-2xl p-12 text-center">
                                        <p className="text-gray-500">{t.noPodcasts}</p>
                                        <button 
                                            onClick={() => setActiveTab("home")} 
                                            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            Create Podcast
                                        </button>
                                    </div>
                                )}
                                {userPodcasts.length > 0 && (
                                    <div className="grid gap-4">
                                        {userPodcasts.map(podcast => (
                                            <PodcastCard 
                                                key={podcast.job_id} 
                                                podcast={podcast} 
                                                onPlay={playPodcast} 
                                                onDelete={deletePodcast} 
                                                language={language} 
                                            />
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