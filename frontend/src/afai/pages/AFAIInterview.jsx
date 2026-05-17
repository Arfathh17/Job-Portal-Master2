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
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  const setup = initialState?.setup;
  const sessionId = initialState?.sessionId;

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
  }, []);

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

  const submitAnswer = async event => {
    event.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || isThinking || isTyping) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setAnswer('');
    setError('');
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

  const endInterview = () => {
    navigate('/afai/summary', { state: { sessionId } });
  };

  if (!sessionId || !setup) {
    return (
      <MotionPage className="flex min-h-screen items-center justify-center px-5">
        <GlassCard className="p-6">
          <h1 className="text-xl font-black text-white">No active AFAI session</h1>
          <button onClick={() => navigate('/afai')} className="mt-4 rounded-xl bg-stone-50 px-4 py-2 text-sm font-black text-slate-950">
            Start setup
          </button>
        </GlassCard>
      </MotionPage>
    );
  }

  return (
    <MotionPage className="pb-12">
      <header className="mx-auto max-w-7xl px-5 pt-8">
        <GlassCard className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/afai')} className="icon-btn" aria-label="Back to setup">
              <ArrowLeft size={18} />
            </button>
            <div>
              <NeonBadge>AFAI live interview</NeonBadge>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white">{setup.role}</h1>
            </div>
          </div>
          <button onClick={endInterview} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-100 transition hover:border-white/20 hover:bg-white/[0.075]">
            <Square size={16} />
            End interview
          </button>
        </GlassCard>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[1fr_320px]">
        <GlassCard className="flex min-h-[72vh] flex-col" hover={false}>
          <div className="border-b border-white/10 px-5 py-4">
            <ScoreStrip stats={stats} />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 transition-all duration-200 ${message.role === 'user' ? 'bg-stone-50 text-slate-950 shadow-[0_18px_42px_rgba(0,0,0,0.22)]' : 'border border-white/10 bg-white/[0.05] text-slate-100'}`}>
                  {message.role === 'assistant' && (
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <Bot size={15} />
                        AFAI interviewer
                      </span>
                      <FeedbackBadge evaluation={message.feedback} />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
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

          <form onSubmit={submitAnswer} className="border-t border-white/10 p-4">
            {error && <p className="mb-3 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
            <div className="flex gap-3">
              <textarea
                value={answer}
                onChange={event => setAnswer(event.target.value)}
                placeholder="Answer as if you are speaking to a real interviewer..."
                rows={3}
                className="field min-h-[76px] resize-none"
              />
              <button disabled={isThinking || isTyping || !answer.trim()} className="inline-flex min-w-[46px] items-center justify-center rounded-xl bg-stone-50 px-4 text-slate-950 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send answer">
                <Send size={19} />
              </button>
            </div>
          </form>
        </GlassCard>

        <aside className="space-y-4">
          <GlassCard className="p-5">
            <h2 className="text-lg font-black text-white">Session context</h2>
            <div className="voice-wave mt-4 flex h-10 items-end gap-1">
              {Array.from({ length: 16 }).map((_, index) => <span key={index} style={{ animationDelay: `${index * 0.06}s` }} />)}
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Experience</dt>
                <dd className="font-bold text-slate-100">{setup.experience}</dd>
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

          <GlassCard className="p-5 text-sm text-slate-300">
            <div className="flex items-center gap-2 font-black text-white">
              <CheckCircle2 size={18} />
              Interview rule
            </div>
            <p className="mt-2">Think aloud. AFAI evaluates reasoning, trade-offs, clarity, and real-world readiness, not just final keywords.</p>
          </GlassCard>
        </aside>
      </section>
    </MotionPage>
  );
}
