'use client';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Get It Together
          </h1>
          <p className="text-lg text-gray-600">
            Get roasted into productivity
          </p>
        </div>

        {/* Input Section */}
        <section id="input-section" className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-6">
          <div className="mb-4">
            <label htmlFor="task-input" className="block text-sm font-medium text-gray-700 mb-2">
              What's the task you're procrastinating on?
            </label>
            <input
              id="task-input"
              type="text"
              placeholder="e.g., Clean my room, File my taxes, Email the professor..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button className="suggestion-chip px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition">
              Call the dentist
            </button>
            <button className="suggestion-chip px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition">
              Do laundry
            </button>
            <button className="suggestion-chip px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition">
              Study for test
            </button>
            <button className="suggestion-chip px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition">
              Email boss
            </button>
          </div>

          {/* Roast Button */}
          <button
            id="roast-btn"
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 transition shadow-md"
          >
            Roast Me & Break It Down 🔥
          </button>
        </section>

        {/* Results Section */}
        <section id="results-section" className="hidden bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Logo Emoji */}
          <div id="logo-emoji" className="text-5xl text-center mb-4">
            🫠
          </div>

          {/* Roast Text */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mb-6">
            <p id="roast-text" className="text-lg font-semibold text-gray-800 mb-2">
              {/* Roast content will be inserted here */}
            </p>
            <p id="motivation-text" className="text-gray-700 italic">
              {/* Motivation text will be inserted here */}
            </p>
          </div>

          {/* Mode Switcher */}
          <div id="mode-switcher" className="flex gap-2 mb-6 bg-gray-100 p-2 rounded-lg">
            <button className="mode-button flex-1 px-4 py-2 rounded-lg font-medium transition" data-mode="breakdown">
              Break It Down
            </button>
            <button className="mode-button flex-1 px-4 py-2 rounded-lg font-medium transition" data-mode="custom">
              Custom Steps
            </button>
          </div>

          {/* Steps Section */}
          <div id="editable-steps-container" className="mb-6 hidden">
            <h3 className="font-semibold text-gray-800 mb-3">Edit your steps:</h3>
            <textarea
              id="editable-steps-textarea"
              placeholder="Enter your steps, one per line..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none mb-3"
              rows={6}
            />
            <button
              id="update-steps-btn"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
            >
              Update Steps
            </button>
          </div>

          {/* Custom Steps Textarea */}
          <div id="custom-steps-container" className="mb-6 hidden">
            <h3 className="font-semibold text-gray-800 mb-3">Type your custom steps (one per line):</h3>
            <textarea
              id="custom-steps-textarea"
              placeholder="Step 1&#10;Step 2&#10;Step 3..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none mb-3"
              rows={6}
            />
            <button
              id="apply-custom-steps-btn"
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition font-medium"
            >
              Apply These Steps
            </button>
          </div>

          {/* Steps List */}
          <ol
            id="steps-list"
            className="space-y-3 mb-6 list-decimal list-inside"
          >
            {/* Steps will be populated here */}
          </ol>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              id="copy-btn"
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition font-medium"
            >
              Copy Steps
            </button>
            <button
              id="another-btn"
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition font-medium"
            >
              Different Take
            </button>
            <button
              id="new-btn"
              className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition font-medium"
            >
              New Task
            </button>
          </div>
        </section>
      </div>

      {/* Toast Notification */}
      <div
        id="toast"
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg hidden"
      >
        {/* Toast message will be inserted here */}
      </div>
    </main>
  );
}
