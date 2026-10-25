import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import ToolTestRunner from "./components/ToolTestRunner";

const API_BASE = "http://localhost:5000/api";

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
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

/* ----------------------------- Icons ----------------------------- */

function Icon({ name }) {
  const icons = {
    dashboard: "▦",
    servers: "◇",
    tools: "⚙",
    runner: "▶",
    debug: "⌁",
    validation: "✓",
    history: "◷",
    reports: "▤",
    agents: "◎",
    refresh: "↻",
    server: "▣",
    tool: "⚙",
    arrow: "→",
    check: "✓",
    close: "×"
  };

  return <span className="app-icon">{icons[name] || "•"}</span>;
}

/* ----------------------------- Sidebar ----------------------------- */

function Sidebar({ activePage, onNavigate }) {
  const menu = [
    {
      section: "WORKSPACE",
      items: [
        ["dashboard", "Dashboard"],
        ["servers", "Servers"],
        ["tools", "Tools"],
        ["runner", "Test Runner"],
        ["debug", "Debug"],
        ["validation", "Validation"],
        ["history", "History"],
        ["reports", "Reports"],
        ["agents", "Agents"]
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">M</div>

        <div>
          <div className="brand-title">MCP Studio</div>
          <div className="brand-subtitle">TOOL QUALITY PLATFORM</div>
        </div>
      </div>

      <div className="sidebar-content">
        {menu.map((group) => (
          <div className="nav-group" key={group.section}>
            <div className="nav-section-title">{group.section}</div>

            {group.items.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`nav-item ${
                  activePage === id ? "active" : ""
                }`}
                onClick={() => onNavigate(id)}
              >
                <Icon name={id} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-dot" />
        <span>MCP Workspace</span>
      </div>
    </aside>
  );
}

/* ----------------------------- Header ----------------------------- */

function PageHeader({ title, subtitle, onRefresh, connected }) {
  return (
    <header className="page-header">
      <div>
        <div className="breadcrumb">MCP Studio / {title}</div>
        <h1>{title}</h1>

        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="header-actions">
        {onRefresh && (
          <button className="secondary-button" onClick={onRefresh}>
            <Icon name="refresh" />
            Refresh
          </button>
        )}

        <div className={`connection-badge ${connected ? "online" : "offline"}`}>
          <span />
          {connected ? "Connected" : "Backend Offline"}
        </div>
      </div>
    </header>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function Dashboard({
  servers,
  tools,
  loading,
  connected,
  onNavigate,
  onRefresh
}) {
  const connectedServers = servers.filter(
    (server) =>
      String(server.status || "").toLowerCase() === "connected"
  ).length;

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle="Monitor MCP servers, tools and testing activity."
        onRefresh={onRefresh}
        connected={connected}
      />

      <main className="page-content">
        <section className="dashboard-hero">
          <div>
            <div className="eyebrow">MCP TOOL QUALITY WORKSPACE</div>

            <h2>Discover. Test. Validate.</h2>

            <p>
              A centralized workspace for discovering MCP tools,
              executing real tests and evaluating tool quality for
              agent usage.
            </p>

            <button
              className="primary-button"
              onClick={() => onNavigate("runner")}
            >
              Open Test Runner
              <Icon name="arrow" />
            </button>
          </div>

          <div className="hero-status">
            <div className="hero-status-label">WORKSPACE STATUS</div>

            <div className="hero-status-value">
              {connected ? "Operational" : "Offline"}
            </div>

            <div className="hero-status-line">
              <span className={connected ? "status-dot" : "status-dot offline"} />
              MCP backend connection
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <StatCard
            label="Registered Servers"
            value={servers.length}
            icon="server"
            onClick={() => onNavigate("servers")}
          />

          <StatCard
            label="Discovered Tools"
            value={tools.length}
            icon="tool"
            onClick={() => onNavigate("tools")}
          />

          <StatCard
            label="Connected Servers"
            value={connectedServers}
            icon="check"
          />

          <StatCard
            label="Testing Engine"
            value={connected ? "Ready" : "Offline"}
            icon="runner"
          />
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Registered MCP Servers</h3>
                <p>Servers available to the testing workspace.</p>
              </div>

              <button
                className="text-button"
                onClick={() => onNavigate("servers")}
              >
                View all
              </button>
            </div>

            {loading ? (
              <LoadingState />
            ) : servers.length === 0 ? (
              <EmptyState
                title="No MCP servers found"
                text="Register an MCP server in the backend to begin discovery."
              />
            ) : (
              <div className="server-list">
                {servers.slice(0, 5).map((server) => (
                  <div className="server-row" key={server.id}>
                    <div className="server-icon">
                      <Icon name="server" />
                    </div>

                    <div className="server-main">
                      <strong>{server.name || "Unnamed Server"}</strong>
                      <span>
                        {server.transport || "Unknown transport"}
                      </span>
                    </div>

                    <div
                      className={`table-status ${
                        String(server.status || "").toLowerCase() ===
                        "connected"
                          ? "success"
                          : "neutral"
                      }`}
                    >
                      <span />
                      {server.status || "Unknown"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Discovered Tools</h3>
                <p>Tools dynamically discovered from MCP servers.</p>
              </div>

              <button
                className="text-button"
                onClick={() => onNavigate("tools")}
              >
                View all
              </button>
            </div>

            {loading ? (
              <LoadingState />
            ) : tools.length === 0 ? (
              <EmptyState
                title="No tools discovered"
                text="Connect an MCP server and refresh discovery."
              />
            ) : (
              <div className="tool-list">
                {tools.slice(0, 5).map((tool, index) => (
                  <div className="tool-row" key={`${tool.name}-${index}`}>
                    <div className="tool-icon">
                      <Icon name="tool" />
                    </div>

                    <div className="tool-main">
                      <strong>{tool.name}</strong>
                      <span>
                        {tool.description || "No description available"}
                      </span>
                    </div>

                    <button
                      className="small-button"
                      onClick={() => onNavigate("runner")}
                    >
                      Test
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="workflow-panel">
          <div className="panel-header">
            <div>
              <h3>Quality Workflow</h3>
              <p>Core workflow of the MCP Tool Testing Studio.</p>
            </div>
          </div>

          <div className="workflow">
            {[
              ["01", "Discover", "Read tools and schemas from MCP servers."],
              ["02", "Test", "Execute tools with real input values."],
              ["03", "Debug", "Identify input and execution problems."],
              ["04", "Validate", "Evaluate tool quality and readiness."]
            ].map(([number, title, text]) => (
              <div className="workflow-step" key={number}>
                <div className="workflow-number">{number}</div>

                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, onClick }) {
  return (
    <button
      type="button"
      className={`stat-card ${onClick ? "clickable" : ""}`}
      onClick={onClick}
    >
      <div className="stat-card-icon">
        <Icon name={icon} />
      </div>

      <div className="stat-card-info">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </button>
  );
}

/* ----------------------------- Servers ----------------------------- */

function ServersPage({ servers, loading, connected, onRefresh }) {
  return (
    <div className="page">
      <PageHeader
        title="Servers"
        subtitle="View MCP servers registered with the testing workspace."
        onRefresh={onRefresh}
        connected={connected}
      />

      <main className="page-content">
        <section className="section-heading">
          <div>
            <div className="eyebrow">SERVER MANAGEMENT</div>
            <h2>MCP Servers</h2>
            <p>
              Connection information for MCP servers available to
              this workspace.
            </p>
          </div>

          <button className="primary-button" onClick={onRefresh}>
            <Icon name="refresh" />
            Refresh Servers
          </button>
        </section>

        <section className="table-panel">
          {loading ? (
            <LoadingState />
          ) : servers.length === 0 ? (
            <EmptyState
              title="No servers registered"
              text="Create an MCP server record in the backend first."
            />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>SERVER</th>
                    <th>TRANSPORT</th>
                    <th>STATUS</th>
                    <th>URL / COMMAND</th>
                  </tr>
                </thead>

                <tbody>
                  {servers.map((server) => (
                    <tr key={server.id}>
                      <td>
                        <div className="table-server">
                          <div className="table-server-icon">
                            <Icon name="server" />
                          </div>

                          <div>
                            <strong>
                              {server.name || "Unnamed Server"}
                            </strong>

                            <span>
                              {server.authentication_type ||
                                "No authentication"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{server.transport || "—"}</td>

                      <td>
                        <div
                          className={`table-status ${
                            String(server.status || "").toLowerCase() ===
                            "connected"
                              ? "success"
                              : "neutral"
                          }`}
                        >
                          <span />
                          {server.status || "Unknown"}
                        </div>
                      </td>

                      <td className="muted-cell">
                        {server.url || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ----------------------------- Tools ----------------------------- */

function ToolsPage({ tools, loading, connected, onNavigate }) {
  return (
    <div className="page">
      <PageHeader
        title="Tools"
        subtitle="MCP tools dynamically discovered from connected servers."
        connected={connected}
      />

      <main className="page-content">
        <section className="section-heading">
          <div>
            <div className="eyebrow">TOOL DISCOVERY</div>
            <h2>Discovered Tools</h2>
            <p>
              Tool metadata and input schemas returned directly by
              the MCP server.
            </p>
          </div>
        </section>

        {loading ? (
          <LoadingState />
        ) : tools.length === 0 ? (
          <EmptyState
            title="No MCP tools discovered"
            text="Make sure an MCP server is connected and refresh the workspace."
          />
        ) : (
          <div className="tools-grid">
            {tools.map((tool, index) => (
              <div className="tool-card" key={`${tool.name}-${index}`}>
                <div className="tool-card-top">
                  <div className="tool-card-icon">
                    <Icon name="tool" />
                  </div>

                  <span className="tool-label">MCP TOOL</span>
                </div>

                <h3>{tool.name}</h3>

                <p>
                  {tool.description ||
                    "No description provided by the MCP server."}
                </p>

                <div className="tool-meta">
                  <span>Input schema</span>
                  <strong>
                    {tool.inputSchema ? "Available" : "Not available"}
                  </strong>
                </div>

                <button
                  className="primary-button full-width"
                  onClick={() => onNavigate("runner")}
                >
                  Test this tool
                  <Icon name="arrow" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ----------------------------- Utility pages ----------------------------- */

function PlaceholderPage({ title, connected }) {
  return (
    <div className="page">
      <PageHeader
        title={title}
        subtitle={`${title} module of the MCP quality workspace.`}
        connected={connected}
      />

      <main className="page-content">
        <div className="placeholder-card">
          <div className="placeholder-icon">
            <Icon name="tool" />
          </div>

          <div className="eyebrow">MCP QUALITY WORKSPACE</div>

          <h2>{title}</h2>

          <p>
            This module is part of the planned MCP tool quality
            workflow and will use the existing backend services.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ----------------------------- Loading / Empty ----------------------------- */

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <span>Loading workspace data...</span>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">—</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

/* ----------------------------- App ----------------------------- */

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [servers, setServers] = useState([]);
  const [tools, setTools] = useState([]);

  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [error, setError] = useState("");

  const loadServers = useCallback(async () => {
    const data = await apiRequest(`${API_BASE}/servers`);

    if (Array.isArray(data)) {
      return data;
    }

    return Array.isArray(data?.servers) ? data.servers : [];
  }, []);

  const loadTools = useCallback(async (serverList) => {
    const allTools = [];

    for (const server of serverList) {
      try {
        const data = await apiRequest(
          `${API_BASE}/servers/${server.id}/tools`
        );

        const serverTools = Array.isArray(data)
          ? data
          : Array.isArray(data?.tools)
          ? data.tools
          : [];

        serverTools.forEach((tool) => {
          allTools.push({
            ...tool,
            serverId: server.id,
            serverName: server.name
          });
        });
      } catch (toolError) {
        console.error(
          `Could not discover tools for server ${server.id}`,
          toolError
        );
      }
    }

    return allTools;
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const serverList = await loadServers();

      setServers(serverList);

      const discoveredTools = await loadTools(serverList);

      setTools(discoveredTools);

      setBackendConnected(true);
    } catch (err) {
      console.error(err);

      setBackendConnected(false);
      setError(err.message || "Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  }, [loadServers, loadTools]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const currentTitle = useMemo(() => {
    const titles = {
      dashboard: "Dashboard",
      servers: "Servers",
      tools: "Tools",
      runner: "Test Runner",
      debug: "Debug",
      validation: "Validation",
      history: "History",
      reports: "Reports",
      agents: "Agents"
    };

    return titles[activePage] || "MCP Studio";
  }, [activePage]);

  function renderPage() {
    if (activePage === "dashboard") {
      return (
        <Dashboard
          servers={servers}
          tools={tools}
          loading={loading}
          connected={backendConnected}
          onNavigate={setActivePage}
          onRefresh={loadWorkspace}
        />
      );
    }

    if (activePage === "servers") {
      return (
        <ServersPage
          servers={servers}
          loading={loading}
          connected={backendConnected}
          onRefresh={loadWorkspace}
        />
      );
    }

    if (activePage === "tools") {
      return (
        <ToolsPage
          tools={tools}
          loading={loading}
          connected={backendConnected}
          onNavigate={setActivePage}
        />
      );
    }

    if (activePage === "runner") {
      return (
        <ToolTestRunner
          tools={tools}
          servers={servers}
          connected={backendConnected}
        />
      );
    }

    return (
      <PlaceholderPage
        title={currentTitle}
        connected={backendConnected}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <div className="app-main">
        {error && (
          <div className="global-error">
            <div>
              <strong>Backend connection issue</strong>
              <span>{error}</span>
            </div>

            <button onClick={loadWorkspace}>Retry</button>
          </div>
        )}

        {renderPage()}
      </div>
    </div>
  );
}