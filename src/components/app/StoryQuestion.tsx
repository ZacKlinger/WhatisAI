import { useEffect, useId, useRef, useState } from 'react';
import { trackAnalytics } from '@/lib/analytics';
import type { StoryQuestionData } from '@/data/homeFeature';
import '@/styles/story-question.css';

export default function StoryQuestion({ question }: { question: StoryQuestionData }) {
  const [choice, setChoice] = useState('');
  const [revealed, setRevealed] = useState(false);
  const started = useRef(false);
  const result = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const selected = question.choices.find((option) => option.id === choice);
  useEffect(() => { if (revealed) result.current?.focus(); }, [revealed]);

  return <div className="story-question">
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!selected || revealed) return;
      setRevealed(true);
      trackAnalytics('discovery_completed', { widget: 'story-question' });
    }}>
      <fieldset disabled={revealed}>
        <legend>{question.prompt}</legend>
        <div className="story-choices">
          {question.choices.map((option) => <label key={option.id} className={`story-choice ${choice === option.id ? 'is-selected' : ''} ${revealed && option.id === question.answer ? 'is-answer' : ''}`}>
            <input type="radio" name={id} value={option.id} checked={choice === option.id} onChange={() => {
              setChoice(option.id);
              if (!started.current) {
                started.current = true;
                trackAnalytics('discovery_started', { widget: 'story-question' });
              }
            }} />
            <span>{option.label}</span>
            {revealed && option.id === question.answer && <span className="story-answer-label">Best answer</span>}
          </label>)}
        </div>
      </fieldset>
      {!revealed && <div className="story-submit"><button className="btn btn-primary" type="submit" disabled={!choice}>See the explanation <span aria-hidden="true">↗</span></button></div>}
    </form>
    {revealed && <div className="story-result">
      <p className="small story-feedback">{selected?.feedback}</p>
      <h3 ref={result} tabIndex={-1}>{question.takeaway}</h3>
      <p>{question.explanation}</p>
      <div className="row"><a className="arrow-link" href="#dive-deeper">Learn a bit more</a><button className="link small" type="button" onClick={() => {
        setRevealed(false);
        setChoice('');
        document.getElementById('story-question-title')?.focus();
      }}>Try a different answer</button></div>
    </div>}
  </div>;
}
