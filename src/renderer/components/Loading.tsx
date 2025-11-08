export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-black">Loading</h2>
        <p className="text-gray-600 text-sm mt-2">Please wait...</p>
      </div>
    </div>
  );
}

