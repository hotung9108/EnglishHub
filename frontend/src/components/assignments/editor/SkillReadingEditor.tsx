import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type {
  ReadingConfig, ReadingQuestionItem, ReadingQuestionType
} from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SkillReadingEditorProps {
  config: ReadingConfig;
  onChange: (updated: ReadingConfig) => void;
}

export const SkillReadingEditor: React.FC<SkillReadingEditorProps> = ({ config, onChange }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

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
      ? [
          isVi ? 'Lựa chọn A' : 'Option A',
          isVi ? 'Lựa chọn B' : 'Option B',
          isVi ? 'Lựa chọn C' : 'Option C',
          isVi ? 'Lựa chọn D' : 'Option D'
        ]
      : undefined;
    const defaultAns = initialOptions ? initialOptions[0] : '';

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
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <span>{isVi ? 'Điểm:' : 'Score:'}</span>
                        <input
                          type="number"
                          min={0.25}
                          step={0.25}
                          value={q.points}
                          onChange={(e) => handleUpdateQuestion(qIdx, 'points', parseFloat(e.target.value) || 1)}
                          className="question-points-input"
                        />
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
                        {(q.options || ['A', 'B', 'C', 'D']).map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = q.correctAnswer === opt;
                          return (
                            <div key={oIdx} className={`question-option-row ${isCorrect ? 'correct' : ''}`}>
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={isCorrect}
                                onChange={() => handleUpdateQuestion(qIdx, 'correctAnswer', opt)}
                              />
                              <span className="question-option-letter">{letter}.</span>
                              <input
                                type="text"
                                className="edit-form-input bg-white py-1 px-3"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[oIdx] = e.target.value;
                                  handleUpdateQuestion(qIdx, 'options', newOpts);
                                  if (isCorrect) handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value);
                                }}
                              />
                            </div>
                          );
                        })}
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
