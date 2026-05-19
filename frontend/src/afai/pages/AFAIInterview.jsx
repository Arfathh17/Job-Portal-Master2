import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, CheckCircle2, Send, Square } from 'lucide-react';
import { sendAFAIMessage } from '../afaiApi';
import ScoreStrip from '../components/ScoreStrip';
import TypingDots from '../components/TypingDots';
import { GlassCard, MotionPage, NeonBadge } from '../../components/PremiumUI';

function loadInitialState(locationState) {
  if (locationState?.sessionId) return locationState;
  try {
    return JSON.parse(sessionStorage.getItem('afaiInterview')) || null;
  } catch {
    return null;
  }
}

const feedbackStyles = {
  CORRECT: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
  PARTIAL: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  VAGUE: 'border-slate-300/20 bg-slate-300/10 text-slate-100',
  INCORRECT: 'border-rose-300/25 bg-rose-300/10 text-rose-100',
  IDK: 'border-slate-300/20 bg-slate-300/10 text-slate-100',
};

const feedbackLabels = {
  CORRECT: 'Correct',
  PARTIAL: 'Partial',
  VAGUE: 'Weak',
  INCORRECT: 'Incorrect',
  IDK: 'Needs review',
};

function FeedbackBadge({ evaluation }) {
  const classification = evaluation?.classification;
  if (!classification || classification === 'INTRO' || classification === 'QUESTION') return null;

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal ${feedbackStyles[classification] || feedbackStyles.PARTIAL}`}>
      {feedbackLabels[classification] || 'Reviewed'}
    </span>
  );
}

export default function AFAIInterview() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialState = useMemo(() => loadInitialState(location.state), [location.state]);
  const [messages, setMessages] = useState(initialState?.messages || []);
  const [stats, setStats] = useState(initialState?.stats || null);
  const [answer, setAnswer] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const bottomRef = useRef(null);
  const formRef = useRef(null);
  const typingTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptBaseRef = useRef('');
  const finalTranscriptRef = useRef('');
  const ignoreRecognitionEndRef = useRef(false);
  const shouldSubmitOnRecognitionEndRef = useRef(false);
  const lastSpokenKeyRef = useRef('');
  const answerRef = useRef('');
  const messagesRef = useRef([]);
  const isThinkingRef = useRef(false);
  const isTypingRef = useRef(false);

  const setup = initialState?.setup;
  const sessionId = initialState?.sessionId;
  const latestAssistantEntry = [...messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(entry => entry.message.role === 'assistant' && entry.message.content?.trim());
  const latestAssistantMessage = latestAssistantEntry?.message;
  const latestAssistantKey = latestAssistantEntry ? `${latestAssistantEntry.index}:${latestAssistantEntry.message.content}` : '';

  const persist = nextState => {
    sessionStorage.setItem('afaiInterview', JSON.stringify({
      ...initialState,
      ...nextState,
      setup,
      sessionId,
    }));
  };

  useEffect(() => () => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    ignoreRecognitionEndRef.current = true;
    recognitionRef.current?.abort?.();
    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const typeAssistantMessage = (baseMessages, response) => new Promise(resolve => {
    const fullText = response.reply || '';
    const assistantMessage = { role: 'assistant', content: '', feedback: response.evaluation };
    const step = Math.max(2, Math.ceil(fullText.length / 90));
    let index = 0;

    setIsTyping(true);
    setMessages([...baseMessages, assistantMessage]);
    scrollToBottom();

    typingTimerRef.current = setInterval(() => {
      index = Math.min(fullText.length, index + step);
      const typedMessage = { ...assistantMessage, content: fullText.slice(0, index) };
      const updatedMessages = [...baseMessages, typedMessage];
      setMessages(updatedMessages);
      scrollToBottom();

      if (index >= fullText.length) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
        setIsTyping(false);
        setStats(response.stats);
        persist({ messages: updatedMessages, stats: response.stats });
        resolve();
      }
    }, 12);
  });

  const stopListening = ({ submitTranscript = false } = {}) => {
    if (!recognitionRef.current) return;
    ignoreRecognitionEndRef.current = !submitTranscript;
    shouldSubmitOnRecognitionEndRef.current = submitTranscript;
    try {
      recognitionRef.current.stop();
    } catch {
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const submitAnswerText = async answerText => {
    const trimmed = answerText.trim();
    if (!trimmed || isThinkingRef.current || isTypingRef.current) return;

    stopListening();
    window.speechSynthesis?.cancel();

    const nextMessages = [...messagesRef.current, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setAnswer('');
    setError('');
    setVoiceError('');
    setIsThinking(true);

    try {
      const response = await sendAFAIMessage({
        ...setup,
        sessionId,
        message: trimmed,
      });

      setIsThinking(false);
      await typeAssistantMessage(nextMessages, response);
    } catch (err) {
      setError(err.response?.data?.error || 'AFAI could not evaluate that answer.');
      setIsTyping(false);
    } finally {
      setIsThinking(false);
    }
  };

  const submitAnswer = async event => {
    event.preventDefault();
    await submitAnswerText(answerRef.current);
  };

  const endInterview = () => {
    navigate('/afai/summary', { state: { sessionId } });
  };

  const startListening = () => {
    setVoiceError('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech input is not supported in this browser. You can still type your answer.');
      return;
    }

    if (recognitionRef.current) {
      ignoreRecognitionEndRef.current = true;
      recognitionRef.current.abort?.();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    transcriptBaseRef.current = answerRef.current.trim();
    finalTranscriptRef.current = '';
    ignoreRecognitionEndRef.current = false;
    shouldSubmitOnRecognitionEndRef.current = true;

    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript || '')
        .join(' ')
        .trim();
      finalTranscriptRef.current = transcript;
      const nextAnswer = [transcriptBaseRef.current, transcript].filter(Boolean).join(' ').trim();
      setAnswer(nextAnswer);
    };

    recognition.onerror = event => {
      setVoiceError(event.error === 'not-allowed'
        ? 'Microphone permission was blocked. Please allow microphone access and try again.'
        : 'Speech input stopped unexpectedly. You can continue typing your answer.');
      shouldSubmitOnRecognitionEndRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      const shouldSubmit = shouldSubmitOnRecognitionEndRef.current && !ignoreRecognitionEndRef.current;
      setIsListening(false);
      recognitionRef.current = null;

      if (shouldSubmit) {
        const nextAnswer = [transcriptBaseRef.current, finalTranscriptRef.current].filter(Boolean).join(' ').trim();
        if (nextAnswer) submitAnswerText(nextAnswer);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (!latestAssistantMessage?.content || !latestAssistantKey || isTyping || isThinking) return;
    if (lastSpokenKeyRef.current === latestAssistantKey) return;

    lastSpokenKeyRef.current = latestAssistantKey;
    setVoiceError('');
    stopListening();

    if (!('speechSynthesis' in window)) {
      setVoiceError('Text-to-speech is not supported in this browser. You can still type your answer.');
      startListening();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latestAssistantMessage.content);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => startListening();
    utterance.onerror = () => {
      setVoiceError('AFAI could not read the question aloud. You can still type your answer.');
      startListening();
    };
    window.speechSynthesis.speak(utterance);
  }, [latestAssistantKey, latestAssistantMessage?.content, isTyping, isThinking]);

  if (!sessionId || !setup) {
    return (
      <MotionPage className="flex min-h-screen items-center justify-center px-5">
        <GlassCard className="p-6">
          <h1 className="text-xl font-black text-white">No active AFAI session</h1>
          <button onClick={() => navigate('/afai')} className="soft-action mt-4 rounded-xl border border-violet-200 bg-white/85 px-4 py-2 text-sm font-black text-slate-950">
            Start Setup
          </button>
        </GlassCard>
      </MotionPage>
    );
  }

  return (
    <MotionPage className="pb-16">
      <header className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 md:px-10">
        <GlassCard className="cinematic-stage flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between" hover={false}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/afai')} className="icon-btn flex-shrink-0" aria-label="Back to setup">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <NeonBadge>AFAI Live Interview</NeonBadge>
              <h1 className="afai-wordmark mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-white break-words">{setup.role}</h1>
            </div>
          </div>
          <button onClick={endInterview} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 sm:px-4 py-2 text-xs sm:text-sm font-black text-slate-100 transition hover:border-white/20 hover:bg-white/[0.075] flex-shrink-0">
            <Square size={16} />
            <span className="hidden xs:inline">End Interview</span>
            <span className="xs:hidden">End</span>
          </button>
        </GlassCard>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
        <GlassCard className="flex min-h-[60vh] sm:min-h-[72vh] flex-col" hover={false}>
          <div className="border-b border-white/10 px-4 sm:px-5 py-4">
            <ScoreStrip stats={stats} />
          </div>

          <div className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto px-3 sm:px-5 py-4 sm:py-5">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] sm:max-w-[86%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm leading-6 transition-all duration-200 ${message.role === 'user' ? 'bg-stone-50 text-slate-950 shadow-[0_18px_42px_rgba(0,0,0,0.22)]' : 'border border-white/10 bg-white/[0.05] text-slate-100'}`}>
                  {message.role === 'assistant' && (
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <Bot size={15} />
                        AFAI Interviewer
                      </span>
                      <FeedbackBadge evaluation={message.feedback} />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form ref={formRef} onSubmit={submitAnswer} className="border-t border-white/10 p-3 sm:p-4">
            {error && <p className="mb-3 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs sm:text-sm text-rose-100 break-words">{error}</p>}
            {voiceError && <p className="mb-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs sm:text-sm text-amber-100 break-words">{voiceError}</p>}
            <div className="flex min-w-0 gap-2 sm:gap-3">
              <textarea
                value={answer}
                onChange={event => setAnswer(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    formRef.current?.requestSubmit();
                  }
                }}
                placeholder="Answer as if you are speaking to a real interviewer..."
                rows={3}
                className="field min-h-[70px] sm:min-h-[76px] resize-none text-xs sm:text-sm"
              />
              <button disabled={isThinking || isTyping || !answer.trim()} className="contrast-action inline-flex min-w-[40px] sm:min-w-[46px] items-center justify-center rounded-xl bg-slate-950 px-3 sm:px-4 py-2 text-white transition hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-40 flex-shrink-0" aria-label="Send answer">
                <Send size={18} />
              </button>
            </div>
          </form>
        </GlassCard>

        <aside className="space-y-4">
          <GlassCard className="p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-black text-white">Session Context</h2>
            <div className="voice-wave mt-4 flex h-10 items-end gap-1">
              {Array.from({ length: 16 }).map((_, index) => <span key={index} style={{ animationDelay: `${index * 0.06}s` }} />)}
            </div>
            <dl className="mt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <dt className="text-slate-500">Experience</dt>
                <dd className="font-bold text-slate-100 break-words">{setup.experience}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Type</dt>
                <dd className="font-bold text-slate-100">{setup.interviewType}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Technologies</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {setup.technologies.map(tech => (
                    <span key={tech} className="rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-xs font-bold text-slate-300">{tech}</span>
                  ))}
                </dd>
              </div>
            </dl>
          </GlassCard>

          <GlassCard className="p-4 sm:p-5 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2 font-black text-white">
              <CheckCircle2 size={18} className="flex-shrink-0" />
              Interview Rule
            </div>
            <p className="mt-2 break-words">Think aloud. AFAI evaluates reasoning, trade-offs, clarity, and real-world readiness, not just final keywords.</p>
          </GlassCard>
        </aside>
      </section>
    </MotionPage>
  );
}
