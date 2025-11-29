import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ParserInfo } from '../lib/types';

interface PaneHeaderProps {
  parser: ParserInfo;
  matches?: boolean;
  loading?: boolean;
  onClose?: () => void;
  isDraggable?: boolean;
}

export function PaneHeader({
  parser,
  matches,
  loading,
  onClose,
  isDraggable = true,
}: PaneHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: parser.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bgColor = loading
    ? 'bg-gray-700'
    : matches === undefined
    ? 'bg-gray-700'
    : matches
    ? 'bg-green-700'
    : 'bg-red-700';

  const hoverInfo = `${parser.name} v${parser.version} (${parser.language})`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${bgColor} px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none`}
      {...attributes}
      {...listeners}
    >
      {parser.repo ? (
        <a
          href={parser.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white font-semibold hover:underline"
          onClick={(e) => e.stopPropagation()}
          title={hoverInfo}
        >
          {parser.name}
        </a>
      ) : (
        <span className="text-white font-semibold" title={hoverInfo}>
          {parser.name}
        </span>
      )}
      <div className="flex items-center gap-2">
        {loading && (
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
        )}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white hover:text-gray-300 text-lg leading-none px-1"
            title="Close pane"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
