import { discoverTools } from "../mcpClient/mcpClient.js";
 
export async function discoverAndNormalizeTools() {
  const tools = await discoverTools();
 
  return tools.map((tool) => {
    const inputSchema = tool.inputSchema || {};
 
    const properties = inputSchema.properties || {};
    const required = inputSchema.required || [];
 
    const parameters = Object.entries(properties).map(
      ([name, schema]) => ({
        name,
        type: schema.type || "unknown",
        description: schema.description || "",
        required: required.includes(name)
      })
    );
 
    return {
      name: tool.name,
      description: tool.description || "",
      inputSchema,
      parameters
    };
  });
}
 