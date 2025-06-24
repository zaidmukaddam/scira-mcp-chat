# structure_processor_server.py
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional, List, Union
import json
import asyncio
import os
import httpx
import uuid
import logging
import re
from datetime import datetime
from jinja2 import Template
from dotenv import load_dotenv


load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("structure-processor-mcp")

# Initialize FastAPI app
app = FastAPI(title="Structure Processor MCP Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM Client for processing structures
class LLMClient:
    @staticmethod
    async def call_model(prompt, model, provider="google"):
        # Select the appropriate API based on provider and model
        if provider == "google":
            return await LLMClient.call_google(prompt, model)
        elif provider == "anthropic":
            return await LLMClient.call_anthropic(prompt, model)
        elif provider == "openai":
            return await LLMClient.call_openai(prompt, model)
        elif provider == "groq":
            return await LLMClient.call_groq(prompt, model)
        else:
            return await LLMClient.call_google(prompt, "gemini-1.5-pro")

    @staticmethod
    async def call_openai(prompt, model="gpt-3.5-turbo"):
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            return "OpenAI API key not provided"
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": "You analyze and format structures."},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 4000
                    }
                )
                result = response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception as e:
            logger.error(f"Error calling OpenAI: {str(e)}")
            return f"OpenAI API error: {str(e)}"

    @staticmethod
    async def call_anthropic(prompt, model="claude-3-haiku-20240307"):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return "Anthropic API key not provided"
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "max_tokens": 4000,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    }
                )
                result = response.json()
                return result.get("content", [{}])[0].get("text", "")
        except Exception as e:
            logger.error(f"Error calling Anthropic: {str(e)}")
            return f"Anthropic API error: {str(e)}"
    
    @staticmethod
    async def call_google(prompt, model="gemini-1.5-pro"):
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return "Google API key not provided"
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [
                            {"role": "user", "parts": [{"text": prompt}]}
                        ],
                        "generationConfig": {
                            "maxOutputTokens": 4000
                        }
                    }
                )
                result = response.json()
                return result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        except Exception as e:
            logger.error(f"Error calling Google: {str(e)}")
            return f"Google API error: {str(e)}"

    @staticmethod
    async def call_groq(prompt, model="llama3-70b-8192"):
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return "Groq API key not provided"
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": "You analyze and format structures."},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 4000
                    }
                )
                result = response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception as e:
            logger.error(f"Error calling Groq: {str(e)}")
            return f"Groq API error: {str(e)}"




# Templates for different structure types
TEMPLATES = {
    "json": """
    <div class="json-container" style="font-family: monospace; padding: 16px;">
        <h3>JSON Structure</h3>
        <pre style="background-color: #f5f5f5; padding: 12px; border-radius: 8px; overflow: auto;">{{ formatted_json }}</pre>
    </div>
    """,
    
    "html": """
    <div class="html-container">
        <h3>HTML Structure Analysis</h3>
        <div class="html-analysis" style="margin-bottom: 16px;">
            <h4>Structure Overview</h4>
            <pre style="background-color: #f5f5f5; padding: 12px; border-radius: 8px; overflow: auto;">{{ structure_analysis }}</pre>
        </div>
        <div class="rendered-content" style="border: 1px solid #ddd; padding: 16px; border-radius: 8px;">
            <h4>Rendered Content</h4>
            {{ safe_html }}
        </div>
    </div>
    """,
    
    "table": """
    <div class="table-container" style="font-family: system-ui, sans-serif; padding: 16px;">
        <h3>Tabular Data</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            <thead>
                <tr style="background-color: #f0f0f0;">
                    {% for header in headers %}
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">{{ header }}</th>
                    {% endfor %}
                </tr>
            </thead>
            <tbody>
                {% for row in rows %}
                <tr style="{% if loop.index % 2 == 0 %}background-color: #f9f9f9;{% endif %}">
                    {% for cell in row %}
                    <td style="padding: 8px; border: 1px solid #ddd;">{{ cell }}</td>
                    {% endfor %}
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    """,
    
    "list": """
    <div class="list-container" style="font-family: system-ui, sans-serif; padding: 16px;">
        <h3>{{ list_title }}</h3>
        <ul style="list-style-type: {{ list_style|default('disc') }}; padding-left: 20px;">
            {% for item in items %}
            <li style="margin-bottom: 8px;">{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    """,
    
    "tree": """
    <div class="tree-container" style="font-family: system-ui, sans-serif; padding: 16px;">
        <h3>{{ tree_title }}</h3>
        <div class="tree" style="margin-left: 12px;">
            {{ tree_html }}
        </div>
    </div>
    """
}


# Single combined tool that fetches and formats financial data
async def process_financial_data(params):
    # Extract parameters
    user_intent = params.get("user_intent", "")
    model = params.get("model", "gemini-1.5-pro")
    provider = params.get("provider", "google")
    
    # First get the financial data (previously done by get_raw_structure)
    financial_data_script = """<script id="financial-data" type="application/json">
{
  "company": "Apple Inc.",
  "fiscal_year": "2024",
  "currency": "USD",
  "total_revenue": 394328000000,
  "revenue_breakdown": [
    {
      "source": "iPhone",
      "revenue": 205000000000,
      "percentage": 52.0
    },
    {
      "source": "Mac",
      "revenue": 40000000000,
      "percentage": 10.2
    },
    {
      "source": "iPad",
      "revenue": 31000000000,
      "percentage": 7.9
    },
    {
      "source": "Wearables, Home and Accessories",
      "revenue": 41000000000,
      "percentage": 10.4
    },
    {
      "source": "Services",
      "revenue": 77000000000,
      "percentage": 19.5
    }
  ],
  "notes": "Values are approximate and based on the company's fiscal 2024 annual report."
}
</script>"""
    
    # Extract JSON content from the script tag
    json_match = re.search(r'<script[^>]*>(.*?)</script>', financial_data_script, re.DOTALL)
    raw_content = json_match.group(1).strip() if json_match else "{}"
    
    # Now format the data 
    prompt = f"""
    You are an expert data visualization tool. Your task is to analyze this JSON data and create an appropriate visualization based on the user's intent.
    
    USER INTENT: {user_intent}
    
    DATA:
    ```json
    {raw_content}
    ```
    
    Follow these steps:
    1. Analyze the data structure and content
    2. Determine if visualization would be helpful (based on user intent)
    3. If visualization is needed, decide the most appropriate type (bar chart, pie chart, line chart, table, etc.)
    4. Create a COMPLETE, SELF-CONTAINED HTML document that includes:
       - All necessary CSS for styling
       - Any required JavaScript libraries via CDN (like Chart.js)
       - The visualization embedded within the document
       - Responsive design that works inside an iframe
    
    Your HTML should work as-is when placed in an iframe without any further processing.
    DO NOT include any explanations or markdown - JUST the complete HTML document.
    Include Chart.js via CDN: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    """
    
    # Get the formatted HTML directly from the LLM
    html_content = await LLMClient.call_model(prompt, model, provider)
    
    # Clean up the response if needed - sometimes LLMs include markdown code blocks
    if "```html" in html_content:
        html_content = html_content.split("```html")[1].split("```")[0].strip()
    elif "```" in html_content:
        html_content = html_content.split("```")[1].split("```")[0].strip()
    
    # Return the raw HTML in the format expected by tool-invocation.tsx
    return {
        "content": [
            {
                "type": "resource",
                "resource": {
                    "uri": f"visualization-{uuid.uuid4()}",
                    "mimeType": "text/html",
                    "text": html_content
                }
            }
        ]
    }

# Define tool schemas
process_financial_data_schema = {
    "description": "Fetch and format financial data in one step",
    "parameters": {
        "type": "object",
        "properties": {
            "user_intent": {
                "type": "string",
                "description": "User's intention or preference for how to display the data (e.g., 'show as chart', 'analyze trends', 'compare values')"
            },
            "model": {
                "type": "string",
                "description": "LLM model to use for processing"
            },
            "provider": {
                "type": "string",
                "enum": ["google", "anthropic", "openai", "groq"],
                "description": "LLM provider to use"
            }
        },
        "required": ["user_intent"]
    }
}

# MCP SSE Protocol implementation
@app.get("/sse")
async def sse_endpoint(request: Request):
    async def event_generator():
        # Send the init message with tool schemas
        init_message = {
            "type": "init", 
            "tools": {
                "process_financial_data": process_financial_data_schema
            }
        }
        yield f"data: {json.dumps(init_message)}\n\n"
        
        # Keep the connection alive
        while True:
            await asyncio.sleep(30)
            yield f"data: {json.dumps({'type': 'ping'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

# MCP tool invocation endpoint
@app.post("/sse")
async def tool_invocation(request: Request):
    try:
        body = await request.json()
        request_type = body.get("type")
        
        if request_type == "invoke":
            tool_name = body.get("name")
            request_id = body.get("requestId")
            params = body.get("params", {})
            
            if tool_name == "process_financial_data":
                result = await process_financial_data(params)
                
                return {
                    "type": "result",
                    "requestId": request_id,
                    "result": result
                }
            else:
                return {
                    "type": "error",
                    "requestId": request_id,
                    "error": f"Unknown tool: {tool_name}"
                }
        else:
            return {"type": "error", "error": f"Unknown request type: {request_type}"}
    
    except Exception as e:
        logger.exception("Error processing request")
        return {"type": "error", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3003)  # Use port 3003 instead of 3002