import { useEffect, useState } from "react";
import "./Validation.css";

const API_BASE = "http://localhost:5000/api";

export default function Validation() {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState("");
  const [validation, setValidation] = useState(null);
  const [loadingTools, setLoadingTools] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTools();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  async function loadTools() {
    try {
      setLoadingTools(true);
      setError("");

      const response = await fetch(`${API_BASE}/servers`);

      if (!response.ok) {
        throw new Error(`Failed to load servers: ${response.status}`);
      }

      const servers = await response.json();

      const serverList = Array.isArray(servers)
        ? servers
        : servers.servers || [];

      if (serverList.length === 0) {
        setTools([]);
        return;
      }

      const allTools = [];

      for (const server of serverList) {
        try {
          const toolResponse = await fetch(
            `${API_BASE}/servers/${server.id}/tools`,
          );

          if (!toolResponse.ok) {
            continue;
          }

          const toolData = await toolResponse.json();

          const serverTools = Array.isArray(toolData)
            ? toolData
            : toolData.tools || [];

          serverTools.forEach((tool) => {
            allTools.push({
              ...tool,
              serverId: server.id,
              serverName: server.name || `Server ${server.id}`,
            });
          });
        } catch {
          // Continue loading tools from other servers.
        }
      }

      setTools(allTools);

      if (allTools.length > 0) {
        setSelectedTool(allTools[0].name);
      }
    } catch (err) {
      setError(err.message || "Failed to load tools.");
    } finally {
      setLoadingTools(false);
    }
  }

  async function validateSelectedTool() {
    if (!selectedTool) {
      setError("Please select a tool.");
      return;
    }

    try {
      setValidating(true);
      setValidation(null);
      setError("");

      const response = await fetch(
        `${API_BASE}/tools/${encodeURIComponent(selectedTool)}/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Validation failed.");
      }

      setValidation(data);
    } catch (err) {
      setError(err.message || "Validation failed.");
    } finally {
      setValidating(false);
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case "AGENT_READY":
        return "ready";
      case "ALMOST_READY":
        return "almost";
      case "NEEDS_WORK":
        return "needs-work";
      case "NOT_READY":
        return "not-ready";
      default:
        return "";
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "AGENT_READY":
        return "Agent Ready";
      case "ALMOST_READY":
        return "Almost Ready";
      case "NEEDS_WORK":
        return "Needs Work";
      case "NOT_READY":
        return "Not Ready";
      default:
        return status || "Unknown";
    }
  }

  function getScoreClass(score) {
    if (score >= 80) return "score-ready";
    if (score >= 60) return "score-almost";
    if (score >= 40) return "score-needs-work";
    return "score-not-ready";
  }

  const checks = validation?.validation?.checks || [];
  const recommendations = validation?.validation?.recommendations || [];

  return (
    <div className="validation-page">
      <div className="validation-header">
        <div>
          <div className="validation-eyebrow">QUALITY & READINESS</div>

          <h1>Tool Validation</h1>

          <p>
            Validate MCP tools for execution quality, error handling, security,
            and agent compatibility.
          </p>
        </div>
      </div>

      <section className="validation-control-card">
        <div className="control-content">
          <div className="control-title">Select MCP Tool</div>

          <div className="control-row">
            <select
              value={selectedTool}
              onChange={(event) => {
                setSelectedTool(event.target.value);
                setValidation(null);
                setError("");
              }}
              disabled={loadingTools || validating}
            >
              {loadingTools && <option>Loading tools...</option>}

              {!loadingTools && tools.length === 0 && (
                <option value="">No tools available</option>
              )}

              {!loadingTools &&
                tools.map((tool) => (
                  <option
                    key={`${tool.serverId}-${tool.name}`}
                    value={tool.name}
                  >
                    {tool.name}
                  </option>
                ))}
            </select>

            <button
              className="validate-button"
              onClick={validateSelectedTool}
              disabled={
                loadingTools ||
                validating ||
                !selectedTool ||
                tools.length === 0
              }
            >
              {validating ? "Validating..." : "Validate Tool"}
            </button>
          </div>

          {selectedTool && (
            <div className="selected-tool">
              <span>Selected:</span>
              <strong>{selectedTool}</strong>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="validation-error">
          <strong>Validation Error</strong>
          <span>{error}</span>
        </div>
      )}

      {validation && (
        <>
          <section className="validation-summary">
            <div className="score-card">
              <div className="score-label">Agent Readiness Score</div>

              <div
                className={`score-number ${getScoreClass(
                  validation.validation.score,
                )}`}
              >
                {validation.validation.score}
                <span>/100</span>
              </div>

              <div
                className={`status-badge ${getStatusClass(
                  validation.validation.status,
                )}`}
              >
                {getStatusLabel(validation.validation.status)}
              </div>
            </div>

            <div className="tool-info-card">
              <div className="info-label">Validated Tool</div>

              <h2>{validation.tool.name}</h2>

              <p>{validation.tool.description || "No description provided."}</p>

              <div className="schema-status">
                <span className="schema-dot"></span>
                Input schema detected
              </div>
            </div>
          </section>

          <section className="checks-section">
            <div className="section-heading">
              <div>
                <h2>Validation Checks</h2>

                <p>Ten quality checks used to determine agent readiness.</p>
              </div>

              <div className="checks-count">
                {checks.filter((check) => check.passed).length}/{checks.length}{" "}
                Passed
              </div>
            </div>

            <div className="checks-grid">
              {checks.map((check, index) => (
                <div
                  className={`check-card ${
                    check.passed ? "check-passed" : "check-failed"
                  }`}
                  key={`${check.name}-${index}`}
                >
                  <div className="check-top">
                    <div className="check-icon">{check.passed ? "✓" : "!"}</div>

                    <div className="check-score">{check.score}</div>
                  </div>

                  <h3>{check.name}</h3>

                  <p>{check.message}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="test-results-section">
            <div className="section-heading">
              <div>
                <h2>Execution Tests</h2>

                <p>
                  Validation also verifies successful execution and invalid
                  input handling.
                </p>
              </div>
            </div>

            <div className="execution-grid">
              <div className="execution-card">
                <div className="execution-header">
                  <div>
                    <span className="execution-label">Positive Test</span>

                    <h3>Valid Input</h3>
                  </div>

                  <span className="result-success">PASSED</span>
                </div>

                <div className="execution-body">
                  <div className="execution-row">
                    <span>Input</span>

                    <code>{JSON.stringify(validation.test.input)}</code>
                  </div>

                  <div className="execution-row">
                    <span>Duration</span>

                    <strong>{validation.test.result.durationMs} ms</strong>
                  </div>

                  <div className="execution-output">
                    <span>Response</span>

                    <pre>
                      {validation.test.result.output?.content?.[0]?.text ||
                        JSON.stringify(validation.test.result.output, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="execution-card negative">
                <div className="execution-header">
                  <div>
                    <span className="execution-label">Negative Test</span>

                    <h3>Invalid Input</h3>
                  </div>

                  <span className="result-error">
                    {validation.negativeTest.result.success
                      ? "FAILED"
                      : "HANDLED"}
                  </span>
                </div>

                <div className="execution-body">
                  <div className="execution-row">
                    <span>Input</span>

                    <code>{"{}"}</code>
                  </div>

                  <div className="execution-row">
                    <span>Duration</span>

                    <strong>
                      {validation.negativeTest.result.durationMs} ms
                    </strong>
                  </div>

                  <div className="execution-output">
                    <span>Error Handling</span>

                    <pre>
                      {validation.negativeTest.result.error ||
                        "No validation error returned."}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {recommendations.length > 0 && (
            <section className="recommendations-section">
              <div className="section-heading">
                <div>
                  <h2>Recommendations</h2>

                  <p>Improvements required to increase agent readiness.</p>
                </div>
              </div>

              <div className="recommendations-list">
                {recommendations.map((recommendation, index) => (
                  <div
                    className="recommendation-item"
                    key={`${recommendation}-${index}`}
                  >
                    <span>{index + 1}</span>

                    <p>{recommendation}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {recommendations.length === 0 && (
            <section className="all-good-card">
              <div className="all-good-icon">✓</div>

              <div>
                <h2>All validation checks passed</h2>

                <p>
                  This tool currently meets the configured requirements for
                  agent readiness.
                </p>
              </div>
            </section>
          )}
        </>
      )}

      {!validation && !validating && !error && (
        <section className="validation-empty">
          <div className="empty-icon">✓</div>

          <h2>Ready to validate</h2>

          <p>
            Select an MCP tool above and run validation to see its Agent
            Readiness Score and detailed quality checks.
          </p>
        </section>
      )}
    </div>
  );
}
