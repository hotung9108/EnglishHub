import { type ReactNode } from 'react';
import { Download, X } from 'lucide-react';

interface FileItemProps {
  name: string;
  extension: 'pdf' | 'docx' | 'jpg' | 'png' | 'mp3' | string;
  size?: string;
  details?: string;
  onDownload?: () => void;
  onRemove?: () => void;
  onView?: () => void;
  primaryAction?: ReactNode;
}

export const FileItem = ({
  name,
  extension,
  size,
  details,
  onDownload,
  onRemove,
  onView,
  primaryAction
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
          <button onClick={onDownload} style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 500, color: 'var(--on-surface-variant)', backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Tải xuống
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
