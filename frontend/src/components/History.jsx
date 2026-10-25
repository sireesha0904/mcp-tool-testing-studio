import { useEffect, useState } from "react";
import "./History.css";

const API_BASE = "http://localhost:5000/api";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRun, setSelectedRun] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/history`);

      if (!response.ok) {
        throw new Error(`Failed to load history: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load history.");
      }

      setHistory(data.history || []);
    } catch (err) {
      setError(err.message || "Failed to load test history.");
    } finally {
      setLoading(false);
    }
  }

  function parseJson(value) {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  const passedCount = history.filter((run) => run.status === "PASSED").length;

  const failedCount = history.filter((run) => run.status === "FAILED").length;

  const filteredHistory =
    filter === "ALL" ? history : history.filter((run) => run.status === filter);

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <div className="history-eyebrow">EXECUTION HISTORY</div>

          <h1>Test History</h1>

          <p>
            Review previous MCP tool executions, results, inputs, outputs, and
            errors.
          </p>
        </div>

        <button
          className="history-refresh-button"
          onClick={loadHistory}
          disabled={loading}
        >
          ↻ {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="history-error">
          <strong>History Error</strong>
          <span>{error}</span>
        </div>
      )}

      <section className="history-stats">
        <div className="history-stat-card">
          <div className="history-stat-label">TOTAL RUNS</div>
          <div className="history-stat-value">{history.length}</div>
        </div>

        <div className="history-stat-card passed">
          <div className="history-stat-label">PASSED</div>
          <div className="history-stat-value">{passedCount}</div>
        </div>

        <div className="history-stat-card failed">
          <div className="history-stat-label">FAILED</div>
          <div className="history-stat-value">{failedCount}</div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-label">SUCCESS RATE</div>
          <div className="history-stat-value">
            {history.length > 0
              ? Math.round((passedCount / history.length) * 100)
              : 0}
            %
          </div>
        </div>
      </section>

      <section className="history-panel">
        <div className="history-panel-header">
          <div>
            <h2>Execution Runs</h2>

            <p>
              Showing {filteredHistory.length} of {history.length} test runs.
            </p>
          </div>

          <div className="history-filters">
            <button
              className={filter === "ALL" ? "active" : ""}
              onClick={() => setFilter("ALL")}
            >
              All
            </button>

            <button
              className={filter === "PASSED" ? "active" : ""}
              onClick={() => setFilter("PASSED")}
            >
              Passed
            </button>

            <button
              className={filter === "FAILED" ? "active" : ""}
              onClick={() => setFilter("FAILED")}
            >
              Failed
            </button>
          </div>
        </div>

        {loading ? (
          <div className="history-loading">
            <div className="history-spinner" />
            <span>Loading test history...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">—</div>

            <h3>No test runs found</h3>

            <p>
              Execute an MCP tool from the Test Runner to create history
              entries.
            </p>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TOOL</th>
                  <th>STATUS</th>
                  <th>INPUT</th>
                  <th>DURATION</th>
                  <th>CREATED</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.map((run) => {
                  const input = parseJson(run.input_json);

                  return (
                    <tr key={run.id}>
                      <td>
                        <span className="run-id">#{run.id}</span>
                      </td>

                      <td>
                        <div className="history-tool">
                          <div className="history-tool-icon">⚙</div>

                          <strong>{run.tool_name || "Unknown Tool"}</strong>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`history-status ${
                            run.status === "PASSED" ? "passed" : "failed"
                          }`}
                        >
                          <span />
                          {run.status}
                        </span>
                      </td>

                      <td>
                        <code className="history-input">
                          {JSON.stringify(input)}
                        </code>
                      </td>

                      <td>
                        <span className="history-duration">
                          {run.duration_ms} ms
                        </span>
                      </td>

                      <td>
                        <span className="history-date">
                          {formatDate(run.created_at)}
                        </span>
                      </td>

                      <td>
                        <button
                          className="details-button"
                          onClick={() =>
                            setSelectedRun(
                              selectedRun?.id === run.id ? null : run,
                            )
                          }
                        >
                          {selectedRun?.id === run.id ? "Hide" : "Details"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {selectedRun && (
              <div className="run-details">
                <div className="run-details-header">
                  <div>
                    <span>TEST RUN</span>

                    <h3>
                      #{selectedRun.id} —{" "}
                      {selectedRun.tool_name || "Unknown Tool"}
                    </h3>
                  </div>

                  <button
                    className="close-details"
                    onClick={() => setSelectedRun(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="run-details-grid">
                  <div className="detail-box">
                    <span>STATUS</span>

                    <strong
                      className={
                        selectedRun.status === "PASSED"
                          ? "detail-passed"
                          : "detail-failed"
                      }
                    >
                      {selectedRun.status}
                    </strong>
                  </div>

                  <div className="detail-box">
                    <span>DURATION</span>

                    <strong>{selectedRun.duration_ms} ms</strong>
                  </div>

                  <div className="detail-box">
                    <span>CREATED</span>

                    <strong>{formatDate(selectedRun.created_at)}</strong>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Input</h4>

                  <pre>
                    {JSON.stringify(parseJson(selectedRun.input_json), null, 2)}
                  </pre>
                </div>

                {selectedRun.output_json && (
                  <div className="detail-section">
                    <h4>Output</h4>

                    <pre>
                      {JSON.stringify(
                        parseJson(selectedRun.output_json),
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                )}

                {selectedRun.error_message && (
                  <div className="detail-section error-section">
                    <h4>Error</h4>

                    <pre>{selectedRun.error_message}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
