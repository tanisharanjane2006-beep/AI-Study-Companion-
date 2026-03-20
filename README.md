# AI Study Companion 📚🧠

AI Study Companion is a modern, vanilla web application designed to help students study smarter. It features an interactive quiz area, a weakness tracker for logging past mistakes, and integrates with AI to generate highly personalized, multi-day study plans based on actual performance.

Built entirely with standard web technologies, it requires no complex build steps or frameworks.

## ✨ Features

* **Interactive Mock Quiz:** Test your knowledge with multiple-choice questions. It tracks your correct answers, mistakes, and skipped questions.
* **AI-Powered Study Plans:** Uses the Grok API (x.ai) to analyze your quiz mistakes and generate a customized, actionable 3-day study plan.
* **Long-Term Memory Integration:** Connects to Hindsight (a local memory API) to retain past mistakes and recall them across different study sessions.
* **Weakness Tracker Dashboard:** A dedicated UI to visualize areas where you struggle the most, helping you prioritize review sessions.
* **Modern "Glassmorphism" UI:** A highly responsive, animated interface built with custom CSS properties, flexbox, and CSS grid. 

## 🛠️ Tech Stack

* **HTML5:** Semantic markup and accessibility (ARIA labels).
* **CSS3:** Custom variables, advanced background gradients, responsive media queries, and clean component styling.
* **Vanilla JavaScript (ES6+):** DOM manipulation, state management, and asynchronous Fetch API calls—no external libraries required.

## 🚀 Getting Started

Since this project uses vanilla web technologies, getting it running is incredibly simple.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/ai-study-companion.git](https://github.com/yourusername/ai-study-companion.git)
    cd ai-study-companion
    ```

2.  **Open the application:**
    Simply open the `index.html` file in your preferred web browser. 
    *Alternatively, use an extension like VS Code's "Live Server" for a better development experience.*

## ⚙️ API Configuration 

To enable the AI Study Plan generation, you need to configure the API keys in `script.js`. The app degrades gracefully and will still run the UI and mock quizzes even if the APIs fail or are missing.

1.  Open `script.js`.
2.  Locate the `generateStudyPlanFromHindsightAndGrok()` function.
3.  **Grok API (Required for AI Plans):**
    Replace `'PASTE_GROK_KEY_HERE'` with your actual API key from x.ai.
    ```javascript
    const GROK_API_KEY = "your-actual-api-key";
    ```
    *⚠️ **WARNING:** Never commit your actual API keys to a public GitHub repository. If you plan to deploy this, you should move the API calls to a secure backend.*

## 📁 Project Structure

```text
├── index.html   # Main layout, tabs, and component structure
├── styles.css   # Variables, layout grid, UI components, and animations
├── script.js    # Tab logic, quiz state management, and API fetch functions
└── README.md    # Project documentation
