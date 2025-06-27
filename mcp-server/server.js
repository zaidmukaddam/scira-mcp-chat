import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5173;

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MCP Server is running',
    timestamp: new Date().toISOString()
  });
});

// Simple MCP-like tools implementation
const tools = [
  {
    name: "format_json",
    description: "Format and prettify JSON data",
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "string",
          description: "JSON string to format"
        }
      },
      required: ["data"]
    }
  },
  {
    name: "validate_json",
    description: "Validate JSON syntax",
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "string", 
          description: "JSON string to validate"
        }
      },
      required: ["data"]
    }
  }
];

// Handle tool execution
function executeTool(name, args) {
  switch (name) {
    case "format_json":
      try {
        const parsed = JSON.parse(args.data);
        const formatted = JSON.stringify(parsed, null, 2);
        return {
          content: [
            {
              type: "text",
              text: `Formatted JSON:\n\`\`\`json\n${formatted}\n\`\`\``
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text", 
              text: `Error formatting JSON: ${error.message}`
            }
          ],
          isError: true
        };
      }
      
    case "validate_json":
      try {
        JSON.parse(args.data);
        return {
          content: [
            {
              type: "text",
              text: "✅ Valid JSON syntax"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Invalid JSON: ${error.message}`
            }
          ],
          isError: true
        };
      }
      
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// SSE endpoint for MCP
app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write('event: connected\n');
  res.write('data: {"type": "connected", "server": "simple-json-processor"}\n\n');

  // Handle MCP protocol over SSE
  req.on('close', () => {
    console.log('SSE connection closed');
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write('event: ping\n');
    res.write('data: {"type": "ping"}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Handle MCP protocol requests
app.post('/sse', async (req, res) => {
  try {
    const mcpRequest = req.body;
    console.log('Received MCP request:', mcpRequest);
    
    // Handle tools/list requests
    if (mcpRequest.method === 'tools/list') {
      res.json({
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: {
          tools: tools
        }
      });
    } 
    // Handle tools/call requests
    else if (mcpRequest.method === 'tools/call') {
      const { name, arguments: args } = mcpRequest.params;
      const result = executeTool(name, args);
      res.json({
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: result
      });
    }
    // Handle initialize requests
    else if (mcpRequest.method === 'initialize') {
      res.json({
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "simple-json-processor",
            version: "1.0.0"
          }
        }
      });
    }
    else {
      res.status(400).json({ 
        jsonrpc: "2.0",
        id: mcpRequest.id,
        error: {
          code: -32601,
          message: `Unknown method: ${mcpRequest.method}`
        }
      });
    }
  } catch (error) {
    console.error('Error handling MCP request:', error);
    res.status(500).json({ 
      jsonrpc: "2.0",
      id: req.body?.id,
      error: {
        code: -32603,
        message: error.message 
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}`);
  console.log(`SSE endpoint available at http://localhost:${PORT}/sse`);
});
