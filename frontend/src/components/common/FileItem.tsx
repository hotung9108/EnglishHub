import { type ReactNode } from 'react';
import { Download, Loader2, X } from 'lucide-react';

interface FileItemProps {
  name: string;
  extension: 'pdf' | 'docx' | 'jpg' | 'png' | 'mp3' | string;
  size?: string;
  details?: string;
  onDownload?: () => void;
  onRemove?: () => void;
  onView?: () => void;
  primaryAction?: ReactNode;
  isDownloading?: boolean;
}

export const FileItem = ({
  name,
  extension,
  size,
  details,
  onDownload,
  onRemove,
  onView,
  primaryAction,
  isDownloading
}: FileItemProps) => {
  const isPdf = extension.toLowerCase() === 'pdf';
  const isDocx = extension.toLowerCase() === 'docx';
  
  const iconClass = isPdf ? 'pdf' : (isDocx ? 'docx' : '');

  return (
    <div className="file-item">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className={`file-item-icon ${iconClass}`}>
          {extension.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '2px' }}>
            {name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {size && <span style={{ fontWeight: 500 }}>{size}</span>}
            {size && details && <span>•</span>}
            {details && <span>{details}</span>}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {primaryAction}
        
        {onView && (
          <button onClick={onView} style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            Xem
          </button>
        )}
        
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--on-surface-variant)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--outline-variant)',
              borderRadius: '6px',
              cursor: isDownloading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isDownloading ? 0.7 : 1,
            }}
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {isDownloading ? 'Đang tải...' : 'Tải xuống'}
          </button>
        )}
        
        {onRemove && (
          <button onClick={onRemove} style={{ padding: '4px', color: 'var(--on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
