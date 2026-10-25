import { useMemo, useState } from "react";
import "./ToolTestRunner.css";

const API_BASE = "http://localhost:5000/api";

function getProperties(schema) {
  if (!schema || typeof schema !== "object") {
    return {};
  }

  return schema.properties || {};
}

function getRequired(schema) {
  if (!schema || typeof schema !== "object") {
    return [];
  }

  return Array.isArray(schema.required) ? schema.required : [];
}

function getDefaultValue(property) {
  if (!property) {
    return "";
  }

  if (property.default !== undefined) {
    return property.default;
  }

  if (property.example !== undefined) {
    return property.example;
  }

  if (property.type === "boolean") {
    return false;
  }

  if (property.type === "number" || property.type === "integer") {
    return "";
  }

  if (property.type === "array" || property.type === "object") {
    return "";
  }

  if (Array.isArray(property.enum) && property.enum.length > 0) {
    return property.enum[0];
  }

  return "";
}

function createInitialValues(tool) {
  const schema = tool?.inputSchema;
  const properties = getProperties(schema);

  const values = {};

  Object.entries(properties).forEach(([name, property]) => {
    values[name] = getDefaultValue(property);
  });

  return values;
}

function convertValue(value, property) {
  if (!property) {
    return value;
  }

  if (property.type === "boolean") {
    return Boolean(value);
  }

  if (property.type === "number") {
    return value === "" ? null : Number(value);
  }

  if (property.type === "integer") {
    return value === "" ? null : parseInt(value, 10);
  }

  if (property.type === "array" || property.type === "object") {
    if (typeof value !== "string") {
      return value;
    }

    if (!value.trim()) {
      return property.type === "array" ? [] : {};
    }

    try {
      return JSON.parse(value);
    } catch {
      throw new Error(
        `Invalid JSON value for parameter "${property.title || "field"}".`
      );
    }
  }

  return value;
}

function getSchemaType(property) {
  if (!property) {
    return "string";
  }

  if (property.type) {
    return property.type;
  }

  if (property.enum) {
    return "string";
  }

  return "string";
}

function formatResult(result) {
  if (result === null || result === undefined) {
    return "";
  }

  if (typeof result === "string") {
    return result;
  }

  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

function extractResultText(data) {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.message) {
    return data.message;
  }

  if (data.error) {
    return data.error;
  }

  if (data.result?.content) {
    return data.result.content
      .map((item) => item?.text || "")
      .filter(Boolean)
      .join("\n");
  }

  if (data.rawResult?.content) {
    return data.rawResult.content
      .map((item) => item?.text || "")
      .filter(Boolean)
      .join("\n");
  }

  if (data.result) {
    return formatResult(data.result);
  }

  return formatResult(data);
}

export default function ToolTestRunner({
  tools = [],
  servers = [],
  connected = false
}) {
  const [selectedToolName, setSelectedToolName] = useState("");
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [localError, setLocalError] = useState("");

  const selectedTool = useMemo(() => {
    return tools.find((tool) => tool.name === selectedToolName) || null;
  }, [tools, selectedToolName]);

  const properties = useMemo(() => {
    return getProperties(selectedTool?.inputSchema);
  }, [selectedTool]);

  const requiredFields = useMemo(() => {
    return getRequired(selectedTool?.inputSchema);
  }, [selectedTool]);

  const serverName = selectedTool?.serverName ||
    servers.find((server) => server.id === selectedTool?.serverId)?.name ||
    "Connected MCP Server";

  function handleToolChange(event) {
    const name = event.target.value;

    setSelectedToolName(name);
    setResult(null);
    setLocalError("");

    const tool = tools.find((item) => item.name === name);

    setValues(createInitialValues(tool));
  }

  function handleValueChange(name, value) {
    setValues((current) => ({
      ...current,
      [name]: value
    }));

    setResult(null);
    setLocalError("");
  }

  function buildArguments() {
    const argumentsObject = {};

    Object.entries(properties).forEach(([name, property]) => {
      const rawValue = values[name];

      if (
        rawValue === undefined ||
        rawValue === null ||
        rawValue === ""
      ) {
        if (requiredFields.includes(name)) {
          throw new Error(`Required parameter "${name}" is missing.`);
        }

        return;
      }

      argumentsObject[name] = convertValue(rawValue, property);
    });

    return argumentsObject;
  }

  async function runTest() {
    if (!selectedTool) {
      setLocalError("Select an MCP tool before running the test.");
      return;
    }

    setRunning(true);
    setResult(null);
    setLocalError("");

    try {
      const argumentsObject = buildArguments();

      const response = await fetch(
        `${API_BASE}/tools/${encodeURIComponent(
          selectedTool.name
        )}/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(argumentsObject)
        }
      );

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {
          message: text
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`
        );
      }

      setResult({
        success: data.success === true,
        status:
          data.status ||
          (data.success === true ? "PASSED" : "FAILED"),
        duration: data.duration_ms || data.duration || null,
        data,
        output: extractResultText(data)
      });
    } catch (error) {
      setResult({
        success: false,
        status: "ERROR",
        data: null,
        output: error.message || "Tool execution failed."
      });
    } finally {
      setRunning(false);
    }
  }

  function clearTest() {
    if (selectedTool) {
      setValues(createInitialValues(selectedTool));
    } else {
      setValues({});
    }

    setResult(null);
    setLocalError("");
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="breadcrumb">MCP Studio / Test Runner</div>

          <h1>Test Runner</h1>

          <p>
            Execute discovered MCP tools with schema-driven input.
          </p>
        </div>

        <div className="runner-header-status">
          <div className="runner-connection">
            <span className={connected ? "online" : "offline"} />
            {connected ? "Connected" : "Backend Offline"}
          </div>
        </div>
      </header>

      <main className="runner-page">
        <section className="runner-intro">
          <div>
            <div className="runner-eyebrow">MCP TOOL EXECUTION</div>

            <h2>Test an MCP tool</h2>

            <p>
              Select a discovered tool. Its input form is generated
              automatically from the MCP input schema.
            </p>
          </div>

          <div className="runner-server-info">
            <span>SERVER</span>
            <strong>{serverName}</strong>
          </div>
        </section>

        {tools.length === 0 ? (
          <section className="runner-empty">
            <div className="runner-empty-icon">⚙</div>

            <h3>No MCP tools available</h3>

            <p>
              No tools were discovered from the connected MCP
              server. Check the server connection and refresh the
              workspace.
            </p>
          </section>
        ) : (
          <section className="runner-layout">
            <div className="runner-form-card">
              <div className="runner-card-header">
                <div>
                  <span>TOOL SELECTION</span>
                  <h3>Choose a tool</h3>
                </div>

                {selectedTool && (
                  <div className="runner-tool-count">
                    {tools.length} available
                  </div>
                )}
              </div>

              <div className="runner-card-body">
                <label className="runner-label">
                  MCP Tool
                </label>

                <select
                  className="runner-select"
                  value={selectedToolName}
                  onChange={handleToolChange}
                >
                  <option value="">
                    Select a discovered tool
                  </option>

                  {tools.map((tool, index) => (
                    <option
                      key={`${tool.name}-${index}`}
                      value={tool.name}
                    >
                      {tool.name}
                    </option>
                  ))}
                </select>

                {!selectedTool && (
                  <div className="runner-selection-note">
                    Select a tool to load its MCP input schema.
                  </div>
                )}

                {selectedTool && (
                  <>
                    <div className="selected-tool">
                      <div className="selected-tool-icon">
                        ⚙
                      </div>

                      <div>
                        <strong>{selectedTool.name}</strong>

                        <p>
                          {selectedTool.description ||
                            "No description provided by the MCP server."}
                        </p>
                      </div>
                    </div>

                    <div className="schema-heading">
                      <div>
                        <span>INPUT SCHEMA</span>
                        <h3>Tool parameters</h3>
                      </div>

                      <div className="schema-count">
                        {Object.keys(properties).length}{" "}
                        parameter
                        {Object.keys(properties).length === 1
                          ? ""
                          : "s"}
                      </div>
                    </div>

                    {Object.keys(properties).length === 0 ? (
                      <div className="no-parameters">
                        This tool does not require input
                        parameters.
                      </div>
                    ) : (
                      <div className="runner-fields">
                        {Object.entries(properties).map(
                          ([name, property]) => {
                            const type = getSchemaType(property);
                            const required =
                              requiredFields.includes(name);
                            const value =
                              values[name] ??
                              getDefaultValue(property);

                            return (
                              <div
                                className="runner-field"
                                key={name}
                              >
                                <div className="field-heading">
                                  <label
                                    htmlFor={`field-${name}`}
                                  >
                                    {name}
                                    {required && (
                                      <span className="required">
                                        *
                                      </span>
                                    )}
                                  </label>

                                  <span className="field-type">
                                    {type}
                                  </span>
                                </div>

                                {property.description && (
                                  <p className="field-description">
                                    {property.description}
                                  </p>
                                )}

                                {Array.isArray(property.enum) ? (
                                  <select
                                    id={`field-${name}`}
                                    className="runner-input"
                                    value={value}
                                    onChange={(event) =>
                                      handleValueChange(
                                        name,
                                        event.target.value
                                      )
                                    }
                                  >
                                    {property.enum.map(
                                      (option) => (
                                        <option
                                          key={String(option)}
                                          value={option}
                                        >
                                          {String(option)}
                                        </option>
                                      )
                                    )}
                                  </select>
                                ) : type === "boolean" ? (
                                  <label className="boolean-field">
                                    <input
                                      id={`field-${name}`}
                                      type="checkbox"
                                      checked={Boolean(value)}
                                      onChange={(event) =>
                                        handleValueChange(
                                          name,
                                          event.target.checked
                                        )
                                      }
                                    />

                                    <span>
                                      {value
                                        ? "true"
                                        : "false"}
                                    </span>
                                  </label>
                                ) : type === "object" ||
                                  type === "array" ? (
                                  <textarea
                                    id={`field-${name}`}
                                    className="runner-input runner-textarea"
                                    value={
                                      typeof value ===
                                      "string"
                                        ? value
                                        : JSON.stringify(
                                            value,
                                            null,
                                            2
                                          )
                                    }
                                    placeholder={
                                      type === "array"
                                        ? '["value1", "value2"]'
                                        : '{"key": "value"}'
                                    }
                                    onChange={(event) =>
                                      handleValueChange(
                                        name,
                                        event.target.value
                                      )
                                    }
                                  />
                                ) : (
                                  <input
                                    id={`field-${name}`}
                                    className="runner-input"
                                    type={
                                      type === "number" ||
                                      type === "integer"
                                        ? "number"
                                        : "text"
                                    }
                                    value={value}
                                    placeholder={
                                      property.example !==
                                      undefined
                                        ? String(
                                            property.example
                                          )
                                        : `Enter ${name}`
                                    }
                                    onChange={(event) =>
                                      handleValueChange(
                                        name,
                                        event.target.value
                                      )
                                    }
                                  />
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                    {localError && (
                      <div className="runner-inline-error">
                        <strong>Input error</strong>
                        <span>{localError}</span>
                      </div>
                    )}

                    <div className="runner-actions">
                      <button
                        type="button"
                        className="runner-clear-button"
                        onClick={clearTest}
                        disabled={running}
                      >
                        Clear
                      </button>

                      <button
                        type="button"
                        className="runner-run-button"
                        onClick={runTest}
                        disabled={running}
                      >
                        {running ? (
                          <>
                            <span className="button-spinner" />
                            Running...
                          </>
                        ) : (
                          <>
                            <span>▶</span>
                            Run Test
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="runner-result-card">
              <div className="runner-card-header">
                <div>
                  <span>EXECUTION RESULT</span>
                  <h3>Test output</h3>
                </div>

                {result && (
                  <div
                    className={`result-badge ${
                      result.success
                        ? "passed"
                        : "failed"
                    }`}
                  >
                    <span />
                    {result.status}
                  </div>
                )}
              </div>

              <div className="result-body">
                {!result && !running && (
                  <div className="result-empty">
                    <div className="result-empty-icon">
                      ▶
                    </div>

                    <strong>Ready to test</strong>

                    <p>
                      Select a tool, provide its parameters and
                      run the test. The real MCP response will
                      appear here.
                    </p>
                  </div>
                )}

                {running && (
                  <div className="result-running">
                    <div className="large-spinner" />

                    <strong>Executing MCP tool...</strong>

                    <span>
                      Waiting for the MCP server response.
                    </span>
                  </div>
                )}

                {result && !running && (
                  <div className="result-content">
                    <div className="result-summary">
                      <div
                        className={`result-status-box ${
                          result.success
                            ? "success"
                            : "failure"
                        }`}
                      >
                        <div className="result-status-icon">
                          {result.success ? "✓" : "!"}
                        </div>

                        <div>
                          <strong>
                            {result.success
                              ? "Test Passed"
                              : "Test Failed"}
                          </strong>

                          <span>
                            {result.duration
                              ? `${result.duration} ms`
                              : "Execution completed"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="output-section">
                      <div className="output-heading">
                        <span>RESPONSE</span>
                      </div>

                      <pre className="result-output">
                        {result.output ||
                          "No response content returned."}
                      </pre>
                    </div>

                    <div className="output-section">
                      <div className="output-heading">
                        <span>REQUEST INPUT</span>
                      </div>

                      <pre className="result-output small">
                        {formatResult(values)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
