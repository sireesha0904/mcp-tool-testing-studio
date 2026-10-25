import { useState } from "react";
import "./DebugConsole.css";

const API_BASE = "http://localhost:5000/api";

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export default function DebugConsole() {
  const [toolName, setToolName] = useState("getIntegrationStatus");
  const [errorMessage, setErrorMessage] = useState(
    "Input validation error: integrationId is required"
  );

  const [debugResult, setDebugResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeError = async () => {
    if (!errorMessage.trim()) {
      setError("Please enter an error message.");
      return;
    }

    setLoading(true);
    setError("");
    setDebugResult(null);

    try {
      const result = await fetchJson(
        `${API_BASE}/tools/${encodeURIComponent(toolName)}/analyze-error`,
        {
          method: "POST",
          body: JSON.stringify({
            errorMessage: errorMessage.trim()
          })
        }
      );

      setDebugResult(result);
    } catch (err) {
      setError(err.message || "Unable to analyze the error.");
    } finally {
      setLoading(false);
    }
  };

  const clearConsole = () => {
    setErrorMessage("");
    setDebugResult(null);
    setError("");
  };

  return (
    <div className="debug-page">
      <div className="debug-header">
        <div>
          <div className="debug-eyebrow">DEBUGGING ENGINE</div>

          <h1>Debug Console</h1>

          <p>
            Analyze MCP tool failures and identify the likely cause,
            severity, and recommended resolution.
          </p>
        </div>

        <div className="debug-status">
          <span className="debug-status-dot"></span>
          Debugging Engine Ready
        </div>
      </div>

      <div className="debug-layout">
        <section className="debug-panel debug-input-panel">
          <div className="debug-panel-header">
            <div>
              <h2>Error Analysis</h2>
              <p>Provide the MCP tool failure details.</p>
            </div>
          </div>

          <div className="debug-form">
            <div className="debug-field">
              <label htmlFor="debug-tool">Tool</label>

              <input
                id="debug-tool"
                className="debug-input"
                value={toolName}
                onChange={(event) => setToolName(event.target.value)}
                placeholder="Enter MCP tool name"
              />
            </div>

            <div className="debug-field">
              <label htmlFor="debug-error">Error Message</label>

              <textarea
                id="debug-error"
                className="debug-textarea"
                value={errorMessage}
                onChange={(event) => setErrorMessage(event.target.value)}
                placeholder="Paste the MCP tool error here..."
                rows={8}
              />
            </div>

            <div className="debug-actions">
              <button
                className="debug-primary-button"
                onClick={analyzeError}
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Analyze Error"}
              </button>

              <button
                className="debug-secondary-button"
                onClick={clearConsole}
                disabled={loading}
              >
                Clear
              </button>
            </div>

            {error && (
              <div className="debug-request-error">
                <strong>Analysis failed</strong>
                <span>{error}</span>
              </div>
            )}
          </div>
        </section>

        <section className="debug-panel debug-result-panel">
          <div className="debug-panel-header">
            <div>
              <h2>Analysis Result</h2>
              <p>Detected information from the debugging engine.</p>
            </div>
          </div>

          {!debugResult && !loading && (
            <div className="debug-empty">
              <div className="debug-empty-icon">⌁</div>

              <h3>No analysis yet</h3>

              <p>
                Enter an MCP error and select <strong>Analyze Error</strong>{" "}
                to see the diagnosis.
              </p>
            </div>
          )}

          {loading && (
            <div className="debug-loading">
              <div className="debug-spinner"></div>

              <h3>Analyzing error</h3>

              <p>
                The debugging engine is identifying the error category and
                recommended resolution.
              </p>
            </div>
          )}

          {debugResult && !loading && (
            <DebugResult result={debugResult} />
          )}
        </section>
      </div>
    </div>
  );
}

function DebugResult({ result }) {
  const analysis = result?.analysis || result?.debugResult || result;

  const hasError =
    analysis?.hasError ??
    result?.hasError ??
    true;

  const category =
    analysis?.category ||
    result?.category ||
    "UNKNOWN";

  const severity =
    analysis?.severity ||
    result?.severity ||
    "UNKNOWN";

  const cause =
    analysis?.cause ||
    result?.cause ||
    "No cause information available.";

  const suggestion =
    analysis?.suggestion ||
    result?.suggestion ||
    "No recommendation available.";

  return (
    <div className="debug-result">
      <div className="debug-result-status">
        <div>
          <span className="debug-result-label">STATUS</span>

          <h3>
            {hasError ? "Error Detected" : "No Error Detected"}
          </h3>
        </div>

        <span
          className={`debug-result-badge ${
            hasError ? "error" : "success"
          }`}
        >
          {hasError ? "ACTION REQUIRED" : "HEALTHY"}
        </span>
      </div>

      <div className="debug-metrics">
        <div className="debug-metric">
          <span>Category</span>
          <strong>{category}</strong>
        </div>

        <div className="debug-metric">
          <span>Severity</span>

          <strong
            className={`severity-${severity
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            {severity}
          </strong>
        </div>
      </div>

      <div className="debug-detail">
        <span className="debug-detail-title">Likely Cause</span>

        <p>{cause}</p>
      </div>

      <div className="debug-detail recommendation">
        <span className="debug-detail-title">Recommended Resolution</span>

        <p>{suggestion}</p>
      </div>
    </div>
  );
}
