import { useCallback, useEffect, useMemo, useState } from "react";
import "./Reports.css";

const API_BASE = "http://localhost:5000/api";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getStatusClass(status) {
  if (status === "AGENT_READY") return "ready";
  if (status === "ALMOST_READY") return "almost";
  if (status === "NEEDS_WORK") return "needs-work";
  if (status === "NOT_READY") return "not-ready";
  if (status === "PASSED") return "passed";
  if (status === "FAILED") return "failed";

  return "neutral";
}

function getPriorityClass(priority) {
  if (priority === "HIGH") return "high";
  if (priority === "MEDIUM") return "medium";
  if (priority === "LOW") return "low";

  return "neutral";
}

function MetricCard({ label, value, helper, tone = "default" }) {
  return (
    <div className={`report-metric-card ${tone}`}>
      <div className="report-metric-label">{label}</div>
      <div className="report-metric-value">{value}</div>
      <div className="report-metric-helper">{helper}</div>
    </div>
  );
}

function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReport = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_BASE}/reports/quality`);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message || data?.error || "Failed to load quality report.",
        );
      }

      setReport(data);
    } catch (requestError) {
      console.error("Failed to load quality report:", requestError);
      setError(requestError.message || "Failed to load quality report.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReport();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadReport]);

  const summary = report?.summary || {};

  const readinessStatus = useMemo(() => {
    if (summary.agentReady > 0) {
      return "AGENT_READY";
    }

    if (summary.almostReady > 0) {
      return "ALMOST_READY";
    }

    if (summary.needsWork > 0) {
      return "NEEDS_WORK";
    }

    if (summary.notReady > 0) {
      return "NOT_READY";
    }

    return "NO_VALIDATION";
  }, [summary]);

  const readinessLabel =
    readinessStatus === "NO_VALIDATION"
      ? "No Validation"
      : readinessStatus.replaceAll("_", " ");

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <div className="reports-loading-spinner" />
          <p>Generating quality report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <div className="reports-eyebrow">QUALITY & READINESS</div>
            <h1>Quality Reports</h1>
            <p>
              Review MCP tool execution quality, validation results, and agent
              readiness.
            </p>
          </div>
        </div>

        <div className="reports-error">
          <div className="reports-error-icon">!</div>
          <div>
            <h3>Unable to load report</h3>
            <p>{error}</p>
            <button
              className="reports-primary-button"
              onClick={() => loadReport(true)}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <div className="reports-eyebrow">QUALITY & READINESS</div>

          <h1>Quality Reports</h1>

          <p>
            Review MCP tool execution quality, validation results, and agent
            readiness.
          </p>

          {report?.generatedAt && (
            <div className="reports-generated">
              Last generated: {formatDate(report.generatedAt)}
            </div>
          )}
        </div>

        <button
          className="reports-refresh-button"
          onClick={() => loadReport(true)}
          disabled={refreshing}
        >
          <span
            className={refreshing ? "refresh-icon spinning" : "refresh-icon"}
          >
            ↻
          </span>

          {refreshing ? "Refreshing..." : "Refresh Report"}
        </button>
      </div>

      {/* Overview */}
      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Quality Overview</h2>
            <p>Current execution and readiness metrics.</p>
          </div>
        </div>

        <div className="reports-metrics-grid">
          <MetricCard
            label="TEST RUNS"
            value={summary.totalRuns ?? 0}
            helper={`${summary.passedRuns ?? 0} passed · ${
              summary.failedRuns ?? 0
            } failed`}
          />

          <MetricCard
            label="SUCCESS RATE"
            value={`${summary.successRate ?? 0}%`}
            helper="Overall execution reliability"
            tone={summary.successRate >= 80 ? "positive" : "warning"}
          />

          <MetricCard
            label="VALIDATION SCORE"
            value={`${summary.averageValidationScore ?? 0}/100`}
            helper={`${summary.totalValidations ?? 0} validation${
              summary.totalValidations === 1 ? "" : "s"
            } recorded`}
            tone={summary.averageValidationScore >= 80 ? "positive" : "warning"}
          />

          <MetricCard
            label="AGENT READINESS"
            value={readinessLabel}
            helper={`${summary.agentReady ?? 0} agent-ready tool${
              summary.agentReady === 1 ? "" : "s"
            }`}
            tone={readinessStatus === "AGENT_READY" ? "positive" : "warning"}
          />
        </div>
      </section>

      {/* Execution Quality */}
      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Execution Quality</h2>
            <p>Test execution results across MCP tools.</p>
          </div>
        </div>

        <div className="execution-quality-grid">
          <div className="execution-card">
            <div className="execution-card-header">
              <span>Passed Runs</span>
              <strong>{summary.passedRuns ?? 0}</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill passed-fill"
                style={{
                  width: `${Math.min(
                    100,
                    summary.totalRuns
                      ? (summary.passedRuns / summary.totalRuns) * 100
                      : 0,
                  )}%`,
                }}
              />
            </div>

            <div className="execution-card-footer">
              Successful tool executions
            </div>
          </div>

          <div className="execution-card">
            <div className="execution-card-header">
              <span>Failed Runs</span>
              <strong>{summary.failedRuns ?? 0}</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill failed-fill"
                style={{
                  width: `${Math.min(
                    100,
                    summary.totalRuns
                      ? (summary.failedRuns / summary.totalRuns) * 100
                      : 0,
                  )}%`,
                }}
              />
            </div>

            <div className="execution-card-footer">
              Executions requiring investigation
            </div>
          </div>

          <div className="execution-card">
            <div className="execution-card-header">
              <span>Average Duration</span>
              <strong>{summary.averageDurationMs ?? 0} ms</strong>
            </div>

            <div className="duration-indicator">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="execution-card-footer">
              Average tool execution time
            </div>
          </div>
        </div>
      </section>

      {/* Tool Quality */}
      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Tool Quality Summary</h2>
            <p>Execution performance for each MCP tool.</p>
          </div>
        </div>

        {report?.tools?.length ? (
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Total Runs</th>
                  <th>Passed</th>
                  <th>Failed</th>
                  <th>Success Rate</th>
                  <th>Avg. Duration</th>
                </tr>
              </thead>

              <tbody>
                {report.tools.map((tool) => (
                  <tr key={tool.tool_id}>
                    <td>
                      <div className="tool-name-cell">
                        <span className="tool-status-dot" />
                        <strong>{tool.tool_name}</strong>
                      </div>
                    </td>

                    <td>{tool.total_runs}</td>

                    <td>
                      <span className="table-success">{tool.passed_runs}</span>
                    </td>

                    <td>
                      <span className="table-failed">{tool.failed_runs}</span>
                    </td>

                    <td>
                      <div className="table-rate">
                        <span>{tool.success_rate}%</span>

                        <div className="mini-progress">
                          <div
                            style={{
                              width: `${Math.min(
                                100,
                                tool.success_rate || 0,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>{tool.average_duration_ms ?? 0} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-empty">
            No tool execution data is available yet.
          </div>
        )}
      </section>

      {/* Agent Readiness */}
      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Agent Readiness</h2>
            <p>Latest validation result for each tested MCP tool.</p>
          </div>
        </div>

        <div className="readiness-summary-grid">
          <div className="readiness-summary-card ready">
            <span>AGENT READY</span>
            <strong>{summary.agentReady ?? 0}</strong>
          </div>

          <div className="readiness-summary-card almost">
            <span>ALMOST READY</span>
            <strong>{summary.almostReady ?? 0}</strong>
          </div>

          <div className="readiness-summary-card needs-work">
            <span>NEEDS WORK</span>
            <strong>{summary.needsWork ?? 0}</strong>
          </div>

          <div className="readiness-summary-card not-ready">
            <span>NOT READY</span>
            <strong>{summary.notReady ?? 0}</strong>
          </div>
        </div>

        {report?.validations?.length ? (
          <div className="report-table-container">
            <table className="report-table validation-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Validated</th>
                </tr>
              </thead>

              <tbody>
                {report.validations.map((validation) => (
                  <tr key={validation.id}>
                    <td>
                      <strong>{validation.tool_name || "Unknown Tool"}</strong>
                    </td>

                    <td>
                      <span className="score-value">
                        {validation.score}/100
                      </span>
                    </td>

                    <td>
                      <span
                        className={`report-status ${getStatusClass(
                          validation.status,
                        )}`}
                      >
                        {validation.status?.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td>{formatDate(validation.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-empty">
            No validation results are available yet.
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Recent Execution Activity</h2>
            <p>Latest MCP tool test executions.</p>
          </div>
        </div>

        {report?.recentRuns?.length ? (
          <div className="report-table-container">
            <table className="report-table activity-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tool</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Error</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {report.recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td>#{run.id}</td>

                    <td>
                      <strong>{run.tool_name || "Unknown Tool"}</strong>
                    </td>

                    <td>
                      <span
                        className={`report-status ${getStatusClass(
                          run.status,
                        )}`}
                      >
                        {run.status}
                      </span>
                    </td>

                    <td>{run.duration_ms ?? 0} ms</td>

                    <td>
                      {run.error_message ? (
                        <span className="error-text">{run.error_message}</span>
                      ) : (
                        <span className="no-error">—</span>
                      )}
                    </td>

                    <td>{formatDate(run.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-empty">No recent execution activity.</div>
        )}
      </section>

      {/* Recommendations */}
      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Recommendations</h2>
            <p>Actions based on the current quality report.</p>
          </div>
        </div>

        <div className="recommendations-list">
          {report?.recommendations?.length ? (
            report.recommendations.map((recommendation, index) => (
              <div
                className="recommendation-card"
                key={`${recommendation.title}-${index}`}
              >
                <div
                  className={`recommendation-priority ${getPriorityClass(
                    recommendation.priority,
                  )}`}
                >
                  {recommendation.priority}
                </div>

                <div className="recommendation-content">
                  <h3>{recommendation.title}</h3>
                  <p>{recommendation.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="recommendations-empty">
              <div className="recommendations-check">✓</div>
              <div>
                <strong>No critical recommendations</strong>
                <p>
                  The current report does not identify any major quality issues.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Reports;

