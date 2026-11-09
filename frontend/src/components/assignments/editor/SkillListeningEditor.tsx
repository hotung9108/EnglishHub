import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import type { 
  ListeningConfig, ListeningQuestionItem 
} from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../common/ToastContext';

interface SkillListeningEditorProps {
  config: ListeningConfig;
  onChange: (updated: ListeningConfig) => void;
  moduleMaxScore?: number;
}

export const SkillListeningEditor: React.FC<SkillListeningEditorProps> = ({ config, onChange, moduleMaxScore }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { error: toastError } = useToast();

  const currentTotalScore = moduleMaxScore !== undefined && moduleMaxScore > 0 ? moduleMaxScore : 10;
  const calculatedScorePerQ = config.questions.length > 0 ? (currentTotalScore / config.questions.length) : 1;
  const pointsDisplay = Number.isInteger(calculatedScorePerQ) ? calculatedScorePerQ : calculatedScorePerQ.toFixed(2);

  const updateField = <K extends keyof ListeningConfig>(key: K, value: ListeningConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleAddQuestion = (type: 'multiple_choice' | 'short_answer') => {
    const newOrder = config.questions.length + 1;
    const initialOptions = type === 'multiple_choice'
      ? ['', '', '', '']
      : undefined;
    const defaultAns = type === 'multiple_choice' ? 'A' : '';

    const newQ: ListeningQuestionItem = {
      id: `lq-${Date.now()}`,
      order: newOrder,
      type,
      prompt: isVi ? `Câu hỏi #${newOrder}: Nhập nội dung câu hỏi...` : `Question #${newOrder}: Enter question statement...`,
      options: initialOptions,
      correctAnswer: defaultAns,
      points: 1
    };

    updateField('questions', [...config.questions, newQ]);
  };

  const handleInsertQuestionAfter = (targetIndex: number, type: 'multiple_choice' | 'short_answer') => {
    const newQ: ListeningQuestionItem = {
      id: `lq-${Date.now()}`,
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
    nextQuestions.splice(targetIndex + 1, 0, newQ);
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

  const handleUpdateQuestion = <K extends keyof ListeningQuestionItem>(
    index: number, 
    field: K, 
    value: ListeningQuestionItem[K]
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleSelectedAudioFile = (file: File) => {
    const validAudioExtensions = ['.mp3', '.wav', '.m4a'];
    const hasValidExt = validAudioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    const isAudioType = file.type.startsWith('audio/') || hasValidExt;

    if (!isAudioType) {
      toastError(isVi ? 'Vui lòng chọn tệp âm thanh hợp lệ (.mp3, .wav, .m4a).' : 'Please select a valid audio file (.mp3, .wav, .m4a).');
      return;
    }

    if (config.audioPreviewUrl) {
      URL.revokeObjectURL(config.audioPreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    onChange({
      ...config,
      audioFile: file,
      audioPreviewUrl: previewUrl,
      audioUrl: file.name,
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectedAudioFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* SECTION 1: Audio Resource */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div>
            <h2 className="edit-card-title">{isVi ? 'Tệp Âm Thanh Đề Bài' : 'Audio Track'}</h2>
            <p className="edit-card-desc">
              {isVi 
                ? 'Tải lên file bài nghe (.mp3, .wav, .m4a). Học sinh sẽ nghe file này khi làm bài.' 
                : 'Upload audio file (.mp3, .wav, .m4a). Students will listen to this track.'}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/m4a,audio/*,.mp3,.wav,.m4a"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleSelectedAudioFile(file);
            }
          }}
        />

        {config.audioPreviewUrl || config.audioUrl ? (() => {
          const getAudioDisplayName = (): string => {
            if (config.audioFile?.name) {
              return config.audioFile.name;
            }
            if (config.audioTitle) {
              return config.audioTitle;
            }
            if (config.audioUrl) {
              try {
                if (config.audioUrl.startsWith('http://') || config.audioUrl.startsWith('https://')) {
                  const parsed = new URL(config.audioUrl);
                  const segment = parsed.pathname.substring(parsed.pathname.lastIndexOf('/') + 1);
                  if (segment) {
                    return decodeURIComponent(segment);
                  }
                }
              } catch {
                // Fallback to url
              }
              return config.audioUrl;
            }
            return isVi ? 'Tệp bài nghe' : 'Audio track';
          };

          const rawAudioDisplayName = getAudioDisplayName();
          const truncatedAudioName =
            rawAudioDisplayName.length > 40
              ? `${rawAudioDisplayName.slice(0, 37)}...`
              : rawAudioDisplayName;

          return (
            <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span
                  className="font-semibold text-sm block truncate min-w-0 flex-1 text-main"
                  title={config.audioFile?.name || config.audioTitle || config.audioUrl || (isVi ? 'Tệp bài nghe' : 'Audio track')}
                >
                  {truncatedAudioName}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary bg-white btn-sm shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isVi ? 'Thay đổi file' : 'Change File'}
                </button>
              </div>
              {(config.audioPreviewUrl || config.audioUrl) && (
                <audio controls className="w-full h-10 mt-1" src={config.audioPreviewUrl || config.audioUrl}>
                  {isVi ? 'Trình duyệt không hỗ trợ thẻ phát âm thanh.' : 'Your browser does not support audio element.'}
                </audio>
              )}
            </div>
          );
        })() : (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-700 hover:border-primary'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-3xl mb-2">🎧</div>
            <p className="font-semibold text-sm text-main mb-1">
              {isVi ? 'Kéo thả tệp âm thanh vào đây hoặc bấm để chọn tệp' : 'Drag & drop audio here or click to browse'}
            </p>
            <p className="text-xs text-muted">
              {isVi ? 'Hỗ trợ .mp3, .wav, .m4a (tối đa 50MB)' : 'Supports .mp3, .wav, .m4a (up to 50MB)'}
            </p>
          </div>
        )}

        {/* Transcript / Instructions */}
        <div className="edit-form-group mb-0 mt-4">
          <label className="edit-form-label">
            {isVi ? 'Lời thoại / Hướng dẫn bài nghe' : 'Transcript / Instructions'}
          </label>
          <textarea 
            className="edit-form-textarea resize-y" 
            rows={6}
            value={config.transcript || ''}
            onChange={(e) => updateField('transcript', e.target.value)}
            placeholder={isVi 
              ? 'Nhập nội dung lời thoại của bài nghe hoặc hướng dẫn làm bài cho học viên...' 
              : 'Enter audio transcript or instructions for students...'}
          />
        </div>
      </section>

      {/* SECTION 2: Questions Builder */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div>
            <h2 className="edit-card-title">
              {isVi ? 'Danh Sách Câu Hỏi & Đáp Án' : 'Listening Questions & Answer Keys'}
            </h2>
            <p className="edit-card-desc">
              {isVi
                ? 'Tạo các câu hỏi trắc nghiệm hoặc điền từ cho bài nghe.'
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

        {/* Questions list */}
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
                      placeholder={isVi ? 'Nhập nội dung câu hỏi hoặc câu có chỗ trống [ _____ ]...' : 'Enter question text or sentence with blank [ _____ ]...'}
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
                    /* Short Answer / Blank */
                    <div className="edit-form-group mb-0">
                      <label className="edit-form-label text-xs">
                        {isVi ? 'Đáp án chính xác' : 'Exact Target Answer'} <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        className="edit-form-input bg-white"
                        value={q.correctAnswer}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value)}
                        placeholder={isVi ? 'Ví dụ: Central Park' : 'e.g. Central Park'}
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

export default SkillListeningEditor;
