'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to your console
    console.error('Unhandled UI Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f17] px-6 text-center">
      {/* Warning Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 mb-6 text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 7.5h.008v.008H12v-.008Z" />
        </svg>
      </div>
      
      {/* Heading */}
      <h2 className="text-2xl font-bold text-white mb-2">Something went wrong!</h2>
      
      {/* Subtext */}
      <p className="text-gray-400 mb-8 max-w-md text-sm">
        An unexpected error occurred while loading this page. This could be due to a connection issue or an API timeout.
      </p>
      
      {/* Reset/Retry Button */}
      <button
        onClick={() => reset()}
        className="px-6 py-3 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold shadow-lg shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
      >
        Try Again
      </button>
    </div>
  );
}
