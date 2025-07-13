export default function Skeleton() {
    return (
      <div className="space-y-4 p-4">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-400 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-400 rounded w-3/4"></div>
              <div className="h-4 bg-gray-400 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  