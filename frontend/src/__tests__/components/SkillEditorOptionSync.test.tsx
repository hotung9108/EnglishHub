import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillReadingEditor } from '../../components/assignments/editor/SkillReadingEditor';
import { SkillListeningEditor } from '../../components/assignments/editor/SkillListeningEditor';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ToastProvider } from '../../components/common/ToastContext';
import type { ReadingConfig, ListeningConfig } from '../../types/assignment-editor.types';

describe('SkillReadingEditor & SkillListeningEditor Option Sync (FE-103)', () => {
  it('updates both options and correctAnswer atomically when typing into Option A in SkillReadingEditor', () => {
    const onChange = vi.fn();
    const config: ReadingConfig = {
      passageTitle: 'Test Title',
      passageContent: 'Test passage',
      paragraphs: [{ id: 'p-1', label: 'A', content: 'Test passage' }],
      questions: [
        {
          id: 'rq-1',
          order: 1,
          type: 'multiple_choice',
          prompt: 'What is the main topic?',
          options: ['', '', '', ''],
          correctAnswer: 'A',
          points: 1,
        },
      ],
    };

    render(
      <LanguageProvider>
        <SkillReadingEditor config={config} onChange={onChange} />
      </LanguageProvider>
    );

    const optionInputs = screen.getAllByRole('textbox').filter((el) =>
      el.getAttribute('placeholder')?.includes('Lựa chọn') ||
      el.getAttribute('placeholder')?.includes('Option')
    );

    expect(optionInputs.length).toBe(4);

    // Type into Option A (which is currently the correct answer)
    fireEvent.change(optionInputs[0], { target: { value: 'Artificial Intelligence' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedConfig: ReadingConfig = onChange.mock.calls[0][0];
    expect(updatedConfig.questions[0].options?.[0]).toBe('Artificial Intelligence');
    expect(updatedConfig.questions[0].correctAnswer).toBe('Artificial Intelligence');
  });

  it('updates only options and leaves correctAnswer untouched when typing into Option B in SkillReadingEditor', () => {
    const onChange = vi.fn();
    const config: ReadingConfig = {
      passageTitle: 'Test Title',
      passageContent: 'Test passage',
      questions: [
        {
          id: 'rq-1',
          order: 1,
          type: 'multiple_choice',
          prompt: 'What is the main topic?',
          options: ['Option A text', '', '', ''],
          correctAnswer: 'Option A text',
          points: 1,
        },
      ],
    };

    render(
      <LanguageProvider>
        <SkillReadingEditor config={config} onChange={onChange} />
      </LanguageProvider>
    );

    const optionInputs = screen.getAllByRole('textbox').filter((el) =>
      el.getAttribute('placeholder')?.includes('Lựa chọn') ||
      el.getAttribute('placeholder')?.includes('Option')
    );

    // Type into Option B (not correct answer)
    fireEvent.change(optionInputs[1], { target: { value: 'Machine Learning' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedConfig: ReadingConfig = onChange.mock.calls[0][0];
    expect(updatedConfig.questions[0].options?.[1]).toBe('Machine Learning');
    expect(updatedConfig.questions[0].correctAnswer).toBe('Option A text');
  });

  it('updates both options and correctAnswer atomically when typing into Option A in SkillListeningEditor', () => {
    const onChange = vi.fn();
    const config: ListeningConfig = {
      audioTitle: 'Sample Audio',
      audioUrl: 'https://example.com/audio.mp3',
      transcript: 'Sample audio transcript',
      questions: [
        {
          id: 'lq-1',
          order: 1,
          type: 'multiple_choice',
          prompt: 'Listen and choose the correct answer:',
          options: ['', '', '', ''],
          correctAnswer: 'A',
          points: 1,
        },
      ],
    };

    render(
      <LanguageProvider>
        <ToastProvider>
          <SkillListeningEditor config={config} onChange={onChange} />
        </ToastProvider>
      </LanguageProvider>
    );

    const optionInputs = screen.getAllByRole('textbox').filter((el) =>
      el.getAttribute('placeholder')?.includes('Lựa chọn') ||
      el.getAttribute('placeholder')?.includes('Option')
    );

    expect(optionInputs.length).toBe(4);

    // Type into Option A
    fireEvent.change(optionInputs[0], { target: { value: 'Listening Option One' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedConfig: ListeningConfig = onChange.mock.calls[0][0];
    expect(updatedConfig.questions[0].options?.[0]).toBe('Listening Option One');
    expect(updatedConfig.questions[0].correctAnswer).toBe('Listening Option One');
  });
});
