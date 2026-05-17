export default function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="AFAI is typing">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-sky-100 [animation-delay:-0.1s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-200" />
    </span>
  );
}
