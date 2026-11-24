import { useId } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { GradebookDateRange } from '../../utils/gradebookDateRange.utils';
import { Button } from '../common/Button';

interface DateRangeFilterProps {
  range: GradebookDateRange;
  reversed: boolean;
  onChange: (range: GradebookDateRange) => void;
}

export function DateRangeFilter({ range, reversed, onChange }: DateRangeFilterProps) {
  const { t } = useLanguage();
  const errorId = useId();
  const errorDescription = reversed ? errorId : undefined;

  return (
    <fieldset className="tcd-card-section mb-4 px-4 py-3">
      <legend className="px-2 text-sm font-semibold">{t('progress.dateRange.title')}</legend>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('progress.dateRange.from')}
          <input
            className="tcd-class-select"
            type="date"
            value={range.from}
            aria-invalid={reversed}
            aria-describedby={errorDescription}
            onChange={event => onChange({ ...range, from: event.currentTarget.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('progress.dateRange.to')}
          <input
            className="tcd-class-select"
            type="date"
            value={range.to}
            aria-invalid={reversed}
            aria-describedby={errorDescription}
            onChange={event => onChange({ ...range, to: event.currentTarget.value })}
          />
        </label>
        <Button variant="secondary" size="sm" disabled={!range.from && !range.to} onClick={() => onChange({ from: '', to: '' })}>
          {t('progress.dateRange.clear')}
        </Button>
      </div>
      {reversed && <p id={errorId} className="mt-2 text-sm text-error" role="alert">{t('progress.dateRange.reversed')}</p>}
    </fieldset>
  );
}
