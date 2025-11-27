interface StatusBarProps {
  total: number;
  disagreeing: number;
  disagreeingNames: string[];
  loading: boolean;
  sandboxAvailable?: boolean;
}

export function StatusBar({ total, disagreeing, disagreeingNames, loading, sandboxAvailable = true }: StatusBarProps) {
  if (!sandboxAvailable) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <span className="text-gray-400 font-semibold">Running parsers...</span>
      </div>
    );
  }

  const allAgree = disagreeing === 0;

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
      {allAgree ? (
        <span className="text-green-400 font-semibold">
          All {total} parsers agree with reference
        </span>
      ) : (
        <span className="text-red-400 font-semibold">
          {disagreeing}/{total} parsers disagree with reference: {disagreeingNames.join(', ')}
        </span>
      )}
    </div>
  );
}
