import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Code, 
  Volume2, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles,
  Terminal,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceRecorder } from './components/VoiceRecorder';
import { transcribeAudio, generateCode, explainCode, textToSpeech } from './services/gemini';
import { cn } from './lib/utils';

export default function App() {
  const [transcription, setTranscription] = useState('');
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleRecordingComplete = async (base64Audio: string, mimeType: string) => {
    setIsProcessing(true);
    try {
      const text = await transcribeAudio(base64Audio, mimeType);
      setTranscription(text || '');
      
      if (text) {
        const generatedCode = await generateCode(text);
        setCode(generatedCode || '');
      }
    } catch (err) {
      console.error('Transcription/Generation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExplainAndSpeak = async () => {
    if (!code) return;
    setIsProcessing(true);
    try {
      const textExplanation = await explainCode(code);
      setExplanation(textExplanation || '');
      
      if (textExplanation) {
        const base64Audio = await textToSpeech(textExplanation);
        if (base64Audio) {
          const binary = atob(base64Audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          
          const audio = new Audio(url);
          audio.onplay = () => setIsPlaying(true);
          audio.onended = () => setIsPlaying(false);
          audio.play();
        }
      }
    } catch (err) {
      console.error('Explanation/TTS error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setTranscription('');
    setCode('');
    setExplanation('');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              VoiceCode <span className="text-indigo-400">Converter</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={clearAll}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              title="Clear all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-8">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Voice Input</h2>
              </div>
              
              <VoiceRecorder 
                onRecordingComplete={handleRecordingComplete} 
                isProcessing={isProcessing} 
              />
              
              <div className="mt-12 space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Transcription</label>
                <div className={cn(
                  "min-h-[120px] p-4 rounded-2xl bg-slate-950/50 border border-slate-800 transition-all",
                  transcription ? "text-slate-200" : "text-slate-600 italic"
                )}>
                  {transcription || "Your voice message will appear here..."}
                </div>
              </div>
            </section>

            <AnimatePresence>
              {code && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={handleExplainAndSpeak}
                    disabled={isProcessing}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 group"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Explain & Speak
                      </>
                    )}
                  </button>
                  
                  {explanation && (
                    <div className="p-6 bg-slate-900/40 border border-indigo-500/30 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          isPlaying ? "bg-indigo-500 text-white animate-pulse" : "bg-slate-800 text-slate-400"
                        )}>
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">AI Explanation</p>
                          <p className="text-slate-300 leading-relaxed">{explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Code Output */}
          <div className="lg:col-span-7">
            <section className="h-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-mono font-medium text-slate-300">Generated Code</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!code}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white disabled:opacity-30"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                {code ? (
                  <SyntaxHighlighter
                    language="javascript"
                    style={atomDark}
                    customStyle={{
                      background: 'transparent',
                      padding: 0,
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center">
                      <Code className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm font-medium">No code generated yet</p>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-3 bg-slate-900/30 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                <span>Powered by Gemini AI</span>
                <span>Ready for conversion</span>
              </div>
            </section>
          </div>

        </div>
      </main>

      {/* Background Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1E293B;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}} />
    </div>
  );
}
