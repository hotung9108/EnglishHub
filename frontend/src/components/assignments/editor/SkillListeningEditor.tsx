import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { 
  ListeningConfig, ListeningQuestionItem 
} from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SkillListeningEditorProps {
  config: ListeningConfig;
  onChange: (updated: ListeningConfig) => void;
}

export const SkillListeningEditor: React.FC<SkillListeningEditorProps> = ({ config, onChange }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const updateField = <K extends keyof ListeningConfig>(key: K, value: ListeningConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleAddQuestion = (type: 'multiple_choice' | 'short_answer') => {
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleSelectedAudioFile = (file: File) => {
    const validAudioExtensions = ['.mp3', '.wav', '.m4a'];
    const hasValidExt = validAudioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    const isAudioType = file.type.startsWith('audio/') || hasValidExt;

    if (!isAudioType) {
      alert(isVi ? 'Vui lòng chọn tệp âm thanh hợp lệ (.mp3, .wav, .m4a).' : 'Please select a valid audio file (.mp3, .wav, .m4a).');
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedAudioFile(file);
    }
  };

  const handleRemoveFile = () => {
    if (config.audioPreviewUrl) {
      URL.revokeObjectURL(config.audioPreviewUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange({
      ...config,
      audioFile: null,
      audioPreviewUrl: '',
      audioUrl: '',
    });
  };

  const hasAudio = Boolean(config.audioFile || config.audioPreviewUrl || config.audioUrl);
  const audioSrc = config.audioPreviewUrl || config.audioUrl;
  const fileNameDisplay = config.audioFile
    ? `${config.audioFile.name} (${(config.audioFile.size / (1024 * 1024)).toFixed(2)} MB)`
    : config.audioUrl;

  return (
    <div className="flex flex-col gap-5">
      {/* SECTION 1: Audio Track & Transcript */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div>
            <h2 className="edit-card-title">
              {isVi ? 'Tệp Âm Thanh & Lời Thoại' : 'Audio Track & Transcript'}
            </h2>
            <p className="edit-card-desc">
              {isVi 
                ? 'Cung cấp nguồn âm thanh bài nghe và lời thoại hướng dẫn học viên.' 
                : 'Provide listening audio source and transcript instructions.'}
            </p>
          </div>
        </div>

        {/* Audio Drag and Drop Upload */}
        <div className="edit-form-group">
          <label className="edit-form-label">
            {isVi ? 'Tệp âm thanh bài nghe' : 'Listening Audio File'} <span className="text-danger">*</span>
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`audio-dropzone ${isDragging ? 'dragging' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp3,audio/wav,audio/m4a,audio/*,.mp3,.wav,.m4a"
              className="hidden"
              onChange={handleFileInputChange}
            />
            {hasAudio ? (
              <div>
                <div className="text-sm font-semibold text-main break-all">
                  {fileNameDisplay}
                </div>
                <div className="text-xs text-muted mt-1">
                  {isVi ? 'Bấm hoặc kéo thả tệp khác để thay đổi' : 'Click or drag another file to replace'}
                </div>
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <audio controls src={audioSrc} className="audio-player-preview" />
                </div>
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn btn-secondary bg-white btn-sm"
                    onClick={handleRemoveFile}
                  >
                    {isVi ? 'Gỡ tệp' : 'Remove'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-semibold text-main">
                  {isVi ? 'Kéo thả tệp âm thanh vào đây hoặc bấm để chọn tệp' : 'Drag and drop audio file here or click to browse'}
                </div>
                <div className="text-xs text-muted mt-1">
                  {isVi ? 'Định dạng hỗ trợ: MP3, WAV, M4A' : 'Supported formats: MP3, WAV, M4A'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transcript / Instructions */}
        <div className="edit-form-group mb-0">
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
