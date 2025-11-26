import { useState } from "preact/hooks";
import { LoadingOverlay } from "../components/LoadingOverlay";

interface PasswordPageProps {
  error?: string;
}

export function PasswordPage({ error }: PasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  const handleSubmit = (e: Event) => {
    if (!password.trim()) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 sm:py-12 flex items-center justify-center">
      {isLoading && (
        <LoadingOverlay message="Verifying..." submessage="Please wait" />
      )}

      <div class="w-full max-w-sm">
        <div class="text-center mb-8 animate-fade-in">
          <div class="w-16 h-16 bg-primary-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-800">Receipt Wrangler</h1>
          <p class="text-slate-500 mt-1">Enter password to continue</p>
        </div>

        {error && (
          <div class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
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
              <p class="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form
          method="POST"
          action="/auth"
          onSubmit={handleSubmit}
          class="animate-slide-up"
        >
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              required
              autoFocus
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            class="w-full py-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Continue
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
