import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import type {
  ReadingConfig, ReadingQuestionItem, ReadingQuestionType
} from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SkillReadingEditorProps {
  config: ReadingConfig;
  onChange: (updated: ReadingConfig) => void;
  moduleMaxScore?: number;
}

export const SkillReadingEditor: React.FC<SkillReadingEditorProps> = ({ config, onChange, moduleMaxScore }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const currentTotalScore = moduleMaxScore !== undefined && moduleMaxScore > 0 ? moduleMaxScore : 10;
  const calculatedScorePerQ = config.questions.length > 0 ? (currentTotalScore / config.questions.length) : 1;
  const pointsDisplay = Number.isInteger(calculatedScorePerQ) ? calculatedScorePerQ : calculatedScorePerQ.toFixed(2);

  const updateField = <K extends keyof ReadingConfig>(key: K, value: ReadingConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  // Derive passage content from either passageContent or paragraphs
  const passageContentValue = config.passageContent !== undefined
    ? config.passageContent
    : (config.paragraphs || []).map(p => p.content).join('\n\n');

  const totalPassageWords = passageContentValue.trim()
    ? passageContentValue.trim().split(/\s+/).length
    : 0;

  const handlePassageContentChange = (content: string) => {
    onChange({
      ...config,
      passageContent: content,
      paragraphs: [{ id: 'p-1', label: 'A', content }]
    });
  };

  // Question handlers
  const handleAddQuestion = (type: ReadingQuestionType) => {
    const newOrder = config.questions.length + 1;
    const initialOptions = type === 'multiple_choice'
      ? ['', '', '', '']
      : undefined;
    const defaultAns = type === 'multiple_choice' ? 'A' : '';

    const newQuestion: ReadingQuestionItem = {
      id: `rq-${Date.now()}`,
      order: newOrder,
      type,
      prompt: isVi ? `Câu hỏi #${newOrder}: Nhập nội dung câu hỏi...` : `Question #${newOrder}: Enter question statement...`,
      options: initialOptions,
      correctAnswer: defaultAns,
      points: 1
    };

    updateField('questions', [...config.questions, newQuestion]);
  };

  const handleInsertQuestionAfter = (targetIndex: number, type: ReadingQuestionType) => {
    const newQuestion: ReadingQuestionItem = {
      id: `rq-${Date.now()}`,
      order: targetIndex + 2,
      type,
      prompt: isVi
        ? (type === 'multiple_choice' ? 'Câu hỏi trắc nghiệm mới: Nhập nội dung...' : 'Câu hỏi điền từ mới: Nhập nội dung...')
        : (type === 'multiple_choice' ? 'New MCQ: Enter question statement...' : 'New blank: Enter statement...'),
      options: type === 'multiple_choice' ? ['', '', '', ''] : undefined,
      correctAnswer: type === 'multiple_choice' ? 'A' : '',
      points: 1
    };

    const nextQuestions = [...config.questions];
    nextQuestions.splice(targetIndex + 1, 0, newQuestion);
    const reordered = nextQuestions.map((q, i) => ({ ...q, order: i + 1 }));
    updateField('questions', reordered);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.questions.length) return;
    const nextQuestions = [...config.questions];
    const temp = nextQuestions[index];
    nextQuestions[index] = nextQuestions[targetIndex];
    nextQuestions[targetIndex] = temp;
    const reordered = nextQuestions.map((q, i) => ({ ...q, order: i + 1 }));
    updateField('questions', reordered);
  };

  const handleUpdateQuestion = <K extends keyof ReadingQuestionItem>(
    index: number,
    field: K,
    value: ReadingQuestionItem[K]
  ) => {
    const updated = [...config.questions];
    updated[index] = { ...updated[index], [field]: value };
    updateField('questions', updated);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = config.questions.filter((_, i) => i !== index);
    const reordered = updated.map((q, i) => ({ ...q, order: i + 1 }));
    updateField('questions', reordered);
  };

  const handleAddOption = (qIdx: number) => {
    const q = config.questions[qIdx];
    const currentOpts = q.options && q.options.length > 0 ? q.options : ['', ''];
    const newOpts = [...currentOpts, ''];
    handleUpdateQuestion(qIdx, 'options', newOpts);
  };

  const handleRemoveOption = (qIdx: number, oIdx: number) => {
    const q = config.questions[qIdx];
    const currentOpts = q.options && q.options.length > 0 ? q.options : ['', ''];
    if (currentOpts.length <= 2) return;

    const removingOpt = currentOpts[oIdx];
    const removingLetter = String.fromCharCode(65 + oIdx);
    const wasCorrect = q.correctAnswer === removingLetter || (removingOpt.trim() !== '' && q.correctAnswer === removingOpt);

    const newOpts = currentOpts.filter((_, idx) => idx !== oIdx);
    const updated = [...config.questions];
    let nextCorrectAnswer = q.correctAnswer;
    if (wasCorrect) {
      nextCorrectAnswer = newOpts[0].trim() || 'A';
    }
    updated[qIdx] = {
      ...updated[qIdx],
      options: newOpts,
      correctAnswer: nextCorrectAnswer,
    };
    updateField('questions', updated);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* SECTION 1: Reading Passage */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div>
            <h2 className="edit-card-title">
              {isVi ? 'Bài Đọc Hiểu' : 'Reading Passage'}
            </h2>
            <p className="edit-card-desc">
              {isVi
                ? 'Nhập tiêu đề và toàn bộ nội dung văn bản bài đọc.'
                : 'Enter passage title and complete reading text.'}
            </p>
          </div>
        </div>

        <div className="edit-form-group">
          <label className="edit-form-label">
            {isVi ? 'Tiêu đề bài đọc' : 'Passage Title'} <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="edit-form-input font-bold"
            value={config.passageTitle}
            onChange={(e) => updateField('passageTitle', e.target.value)}
            placeholder={isVi ? 'Ví dụ: THE EVOLUTION OF RENEWABLE ENERGY' : 'e.g. THE EVOLUTION OF RENEWABLE ENERGY'}
          />
        </div>

        <div className="edit-form-group mb-0">
          <div className="flex justify-between items-center mb-2">
            <label className="edit-form-label m-0">
              {isVi ? 'Nội dung văn bản bài đọc' : 'Passage Content'} <span className="text-danger">*</span>
            </label>
            <span className="text-xs text-muted">
              {isVi ? 'Độ dài bài đọc:' : 'Passage:'} <strong className="text-main">{totalPassageWords}</strong> {isVi ? 'từ' : 'words'}
            </span>
          </div>

          <textarea
            className="edit-form-textarea resize-y"
            rows={12}
            value={passageContentValue}
            onChange={(e) => handlePassageContentChange(e.target.value)}
            placeholder={isVi
              ? 'Dán hoặc gõ nội dung bài đọc tại đây. Bạn có thể tự do ngắt dòng giữa các đoạn văn...'
              : 'Paste or type reading passage content here. You can separate paragraphs with line breaks...'}
          />
        </div>
      </section>

      {/* SECTION 2: Questions Builder */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div>
            <h2 className="edit-card-title">
              {isVi ? 'Danh Sách Câu Hỏi & Đáp Án' : 'Reading Questions & Answer Keys'}
            </h2>
            <p className="edit-card-desc">
              {isVi
                ? 'Tạo các câu hỏi trắc nghiệm hoặc điền từ cho bài đọc.'
                : 'Create multiple choice or short answer questions.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => handleAddQuestion('multiple_choice')}
            >
              <Plus size={13} /> {isVi ? 'Trắc nghiệm' : 'Multiple Choice'}
            </button>
            <button
              type="button"
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => handleAddQuestion('short_answer')}
            >
              <Plus size={13} /> {isVi ? 'Điền từ / Ngắn' : 'Short Answer'}
            </button>
          </div>
        </div>

        {/* Score Summary Badge */}
        <div className="flex flex-wrap items-center justify-between bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 text-xs mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-blue-600 dark:text-blue-400" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">
              {isVi 
                ? `Tổng điểm module: ${currentTotalScore} điểm • Gồm ${config.questions.length} câu hỏi • Mỗi câu: ${pointsDisplay} điểm` 
                : `Module Total: ${currentTotalScore} pts • ${config.questions.length} questions • ${pointsDisplay} pts/question`}
            </span>
          </div>
          <span className="text-muted">
            {isVi ? '(Điểm chia đều tự động theo thang điểm tổng module)' : '(Points distributed evenly by module score)'}
          </span>
        </div>

        {/* Questions List */}
        {config.questions.length === 0 ? (
          <div className="question-empty-state">
            {isVi ? 'Chưa có câu hỏi nào. Vui lòng nhấn nút phía trên để thêm câu hỏi trắc nghiệm hoặc điền từ.' : 'No questions yet. Click the buttons above to add questions.'}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {config.questions.map((q, qIdx) => {
              const isMcq = q.type === 'multiple_choice';

              return (
                <div key={q.id} className="question-builder-item">
                  <div className="question-header-row">
                    <div className="flex items-center gap-2">
                      <span className="question-index-pill">{q.order}</span>
                      <span className={isMcq ? 'question-type-badge-mcq' : 'question-type-badge-short'}>
                        {isMcq ? (isVi ? 'TRẮC NGHIỆM' : 'MULTIPLE CHOICE') : (isVi ? 'ĐIỀN TỪ / NGẮN' : 'SHORT ANSWER')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Move Up / Move Down buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-secondary bg-white btn-sm p-1.5"
                          disabled={qIdx === 0}
                          onClick={() => handleMoveQuestion(qIdx, 'up')}
                          title={isVi ? 'Di chuyển câu hỏi lên trên' : 'Move up'}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary bg-white btn-sm p-1.5"
                          disabled={qIdx === config.questions.length - 1}
                          onClick={() => handleMoveQuestion(qIdx, 'down')}
                          title={isVi ? 'Di chuyển câu hỏi xuống dưới' : 'Move down'}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Readonly Score Pill */}
                      <div className="flex items-center gap-1.5 text-xs text-muted bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-primary">{pointsDisplay} {isVi ? 'điểm' : 'pts'}</span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary bg-white btn-sm text-danger"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        title={isVi ? 'Xóa câu hỏi này' : 'Remove question'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Question Statement */}
                  <div className="edit-form-group">
                    <label className="edit-form-label text-xs">
                      {isVi ? 'Nội dung câu hỏi' : 'Question Statement'} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="edit-form-input font-semibold"
                      value={q.prompt}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'prompt', e.target.value)}
                      placeholder={isVi ? 'Nhập nội dung câu hỏi...' : 'Enter question statement...'}
                    />
                  </div>

                  {/* Multiple Choice Options */}
                  {isMcq ? (
                    <div className="edit-form-group mb-0">
                      <label className="edit-form-label text-xs text-muted">
                        {isVi ? 'Các lựa chọn (Tích chọn radio vào đáp án đúng):' : 'Options (Select correct radio):'}
                      </label>
                      <div className="question-options-list">
                        {(q.options && q.options.length > 0 ? q.options : ['', '', '', '']).map((opt, oIdx, arr) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = q.correctAnswer === letter || (opt.trim() !== '' && q.correctAnswer === opt);
                          return (
                            <div key={oIdx} className={`question-option-row ${isCorrect ? 'correct' : ''}`}>
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={isCorrect}
                                onChange={() => handleUpdateQuestion(qIdx, 'correctAnswer', opt.trim() || letter)}
                              />
                              <span className="question-option-letter">{letter}.</span>
                              <input
                                type="text"
                                className="edit-form-input bg-white py-1 px-3 flex-1"
                                value={opt}
                                placeholder={isVi ? `Lựa chọn ${letter} (nhập đáp án...)` : `Option ${letter} (enter text...)`}
                                onChange={(e) => {
                                  const newOpts = [...arr];
                                  newOpts[oIdx] = e.target.value;
                                  handleUpdateQuestion(qIdx, 'options', newOpts);
                                  if (isCorrect) {
                                    handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value.trim() || letter);
                                  }
                                }}
                              />
                              {arr.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(qIdx, oIdx)}
                                  className="text-slate-400 hover:text-danger p-1 rounded transition-colors cursor-pointer"
                                  title={isVi ? 'Xóa lựa chọn này' : 'Remove option'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                        <div className="flex items-center mt-1">
                          <button
                            type="button"
                            onClick={() => handleAddOption(qIdx)}
                            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary transition-all cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>{isVi ? 'Thêm lựa chọn' : 'Add option'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Short Answer / Fill in the blank */
                    <div className="edit-form-group mb-0">
                      <label className="edit-form-label text-xs">
                        {isVi ? 'Đáp án chính xác' : 'Exact Target Answer'} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="edit-form-input bg-white"
                        value={q.correctAnswer}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value)}
                        placeholder={isVi ? 'Ví dụ: renewable energy' : 'e.g. renewable energy'}
                      />
                    </div>
                  )}

                  {/* Quick Insert Below Action Bar */}
                  <div className="flex items-center justify-between pt-2.5 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-muted font-medium">
                      {isVi ? 'Chèn câu hỏi ngay bên dưới câu này:' : 'Insert question below this one:'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary bg-white btn-xs text-xs py-1 px-2.5 flex items-center gap-1 shadow-sm"
                        onClick={() => handleInsertQuestionAfter(qIdx, 'multiple_choice')}
                      >
                        <Plus size={11} /> {isVi ? 'Trắc nghiệm' : 'MCQ'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary bg-white btn-xs text-xs py-1 px-2.5 flex items-center gap-1 shadow-sm"
                        onClick={() => handleInsertQuestionAfter(qIdx, 'short_answer')}
                      >
                        <Plus size={11} /> {isVi ? 'Điền từ' : 'Blank'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default SkillReadingEditor;
