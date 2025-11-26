interface ErrorPageProps {
  error: string;
}

export function ErrorPage({ error }: ErrorPageProps) {
  return (
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 flex items-center justify-center">
      <div class="max-w-lg w-full">
        <div class="text-center mb-8 animate-fade-in">
          <div class="w-20 h-20 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              class="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-800">
            Something went wrong
          </h1>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 animate-slide-up">
          <div class="flex items-start gap-3">
            <svg
              class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-slate-600 text-sm">{error}</p>
          </div>
        </div>

        <a href="/upload" class="block animate-slide-up stagger-1">
          <button class="w-full py-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 transition-all">
            <span class="flex items-center justify-center gap-2">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Try Again
            </span>
          </button>
        </a>
      </div>
    </div>
  );
}
