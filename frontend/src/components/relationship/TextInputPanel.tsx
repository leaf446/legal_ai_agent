'use client';

import { useState, useCallback } from 'react';
import { PenLine, Trash2 } from 'lucide-react';

interface TextInputPanelProps {
  onTextChange: (text: string) => void;
  disabled?: boolean;
}

export default function TextInputPanel({
  onTextChange,
  disabled = false
}: TextInputPanelProps) {
  const [text, setText] = useState('');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(newText);
  }, [onTextChange]);

  const handleClear = () => {
    setText('');
    onTextChange('');
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        const newText = text ? `${text}\n\n${clipboardText}` : clipboardText;
        setText(newText);
        onTextChange(newText);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };

  const placeholderText = `증거 내용이나 진술서를 직접 입력하세요.

예시:
김철수(원고)와 이영희(피고)는 2015년에 결혼했습니다.
두 사람 사이에는 김민수(자녀)가 있습니다.
2023년 김철수는 이영희가 박지훈과 외도했다는 사실을 알게 되었습니다.`;

  return (
    <div className="border border-neutral-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
          <PenLine className="w-4 h-4 text-primary" />
          텍스트 직접 입력
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePaste}
            disabled={disabled}
            className="text-xs text-primary hover:text-primary-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            붙여넣기
          </button>
          {text.length > 0 && (
            <button
              onClick={handleClear}
              disabled={disabled}
              className="text-xs text-neutral-500 hover:text-error font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              지우기
            </button>
          )}
        </div>
      </div>

      {/* Text Input */}
      <div className="p-4">
        <textarea
          value={text}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholderText}
          className={`
            w-full h-48 p-3 border border-neutral-200 rounded-lg
            text-sm text-neutral-900 placeholder:text-neutral-400
            resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            transition-colors
            ${disabled ? 'bg-neutral-50 cursor-not-allowed' : 'bg-white'}
          `}
        />
      </div>

      {/* Footer */}
      <div className="bg-neutral-50 border-t border-neutral-200 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          {text.length}자 입력됨
        </span>
        {text.length > 0 && (
          <span className="text-xs text-success">
            입력 완료
          </span>
        )}
      </div>
    </div>
  );
}
