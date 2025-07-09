from typing import Any, Optional
import json
import sys
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
 
# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()
 
import nest_asyncio
from mcp.server.fastmcp import Context, FastMCP
from mcp.server import Server
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.routing import Mount, Route
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from mcp.server.sse import SseServerTransport
import uvicorn
 
# LangSmith imports and configuration
from langsmith import Client
from langchain_core.tracers.langchain import LangChainTracer
from langchain_core.callbacks import CallbackManager
import uuid
from datetime import datetime
 
# Import your existing agent components with validation
try:
    from graph import graph as research_agent_graph
    from state import OverallState
except ImportError as e:
    print(f"Failed to import required modules: {e}", file=sys.stderr)
    raise
 
# Configure LangSmith
def setup_langsmith():
    """Configure LangSmith tracing"""
    langsmith_api_key = os.getenv("LANGSMITH_API_KEY")
    langsmith_project = os.getenv("LANGSMITH_PROJECT", "mcp-research-agent")
    
    if not langsmith_api_key:
        print("Warning: LANGSMITH_API_KEY not found. LangSmith tracing disabled.", file=sys.stderr)
        return None, None
    
    # Set environment variables for LangSmith
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = langsmith_api_key
    os.environ["LANGCHAIN_PROJECT"] = langsmith_project
    
    client = Client(api_key=langsmith_api_key)
    tracer = LangChainTracer(project_name=langsmith_project)
    
    print(f"LangSmith tracing enabled for project: {langsmith_project}", file=sys.stderr)
    return client, tracer
 
# Initialize LangSmith
langsmith_client, langsmith_tracer = setup_langsmith()
 
# Apply nest_asyncio for event loop management
try:
    nest_asyncio.apply()
except Exception as e:
    print(f"Error during nest_asyncio.apply(): {str(e)}", file=sys.stderr)
    raise
 
# Global agent instance
agent_instance: Optional[Any] = None
 
@dataclass
class ResearchAgentContext:
    """Application context for the Research Agent MCP server"""
    agent: Any
 
@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[ResearchAgentContext]:
    """Manage application lifecycle with type-safe context"""
    global agent_instance
 
    try:
        # Initialize the research agent graph
        agent_instance = research_agent_graph
        context = ResearchAgentContext(agent=agent_instance)
        print("Research Agent initialized successfully", file=sys.stderr)
        yield context
    finally:
        if agent_instance:
            pass
 
# Initialize FastMCP server with lifespan
mcp = FastMCP("research-agent", lifespan=app_lifespan)
 
@mcp.tool()
async def research_tool(ctx: Context, query: str, max_loops: int = 3) -> str:
    """Research tool that performs comprehensive web research using AI."""
    if agent_instance is None:
        raise Exception("Research agent not initialized")
    
    # Create a proper run context for LangSmith
    run_id = str(uuid.uuid4())
    start_time = datetime.now()
    
    # Use LangSmith's run context manager for proper trace grouping
    if langsmith_client:
        try:
            with langsmith_client.tracing_context(
                run_id=run_id,
                project_name=os.getenv("LANGSMITH_PROJECT", "mcp-research-agent")
            ) as trace_context:
                # Create the main research run
                research_run = langsmith_client.create_run(
                    name="research_tool_execution",
                    run_type="chain",
                    inputs={
                        "query": query,
                        "max_loops": max_loops,
                        "run_id": run_id,
                        "timestamp": start_time.isoformat()
                    },
                    session_id=run_id,
                    run_id=run_id
                )
                
                try:
                    # Create initial state
                    initial_state = OverallState(
                        question=query,
                        max_loops=max_loops,
                        loop_count=0,
                        sources=[],
                        answer="",
                        reflection="",
                        queries=[]
                    )
                    
                    # Configure callback manager with LangSmith tracer
                    callbacks = []
                    if langsmith_tracer:
                        # Set the run context for the tracer
                        langsmith_tracer.run_id = run_id
                        callbacks.append(langsmith_tracer)
                    
                    callback_manager = CallbackManager(callbacks) if callbacks else None
                    
                    # Run the research agent with tracing
                    if callback_manager:
                        result = await agent_instance.ainvoke(
                            initial_state,
                            config={
                                "callbacks": callback_manager,
                                "run_id": run_id,
                                "tags": ["research", "mcp-tool"],
                                "metadata": {
                                    "query": query,
                                    "max_loops": max_loops,
                                    "session_id": run_id
                                }
                            }
                        )
                    else:
                        result = await agent_instance.ainvoke(initial_state)
                    
                    # Format the response
                    response = {
                        "question": result.get("question", ""),
                        "answer": result.get("answer", ""),
                        "sources": result.get("sources", []),
                        "reflection": result.get("reflection", ""),
                        "queries_used": result.get("queries", []),
                        "loop_count": result.get("loop_count", 0),
                        "research_complete": True,
                        "run_id": run_id,
                        "duration_seconds": (datetime.now() - start_time).total_seconds()
                    }
                    
                    # Update the run with successful outputs
                    langsmith_client.update_run(
                        run_id=run_id,
                        outputs=response,
                        end_time=datetime.now()
                    )
                    
                    return json.dumps(response, default=str, ensure_ascii=False, indent=2)
                    
                except Exception as e:
                    # Handle errors and update run
                    error_response = {
                        "error": str(e),
                        "question": query,
                        "research_complete": False,
                        "run_id": run_id,
                        "duration_seconds": (datetime.now() - start_time).total_seconds()
                    }
                    
                    # Update the run with error
                    langsmith_client.update_run(
                        run_id=run_id,
                        outputs=error_response,
                        error=str(e),
                        end_time=datetime.now()
                    )
                    
                    return json.dumps(error_response, default=str, ensure_ascii=False, indent=2)
                    
        except Exception as ls_error:
            print(f"LangSmith error: {ls_error}", file=sys.stderr)
            # Fallback to regular execution without tracing
            pass
    
    # Fallback execution without LangSmith tracing
    try:
        initial_state = OverallState(
            question=query,
            max_loops=max_loops,
            loop_count=0,
            sources=[],
            answer="",
            reflection="",
            queries=[]
        )
        
        result = await agent_instance.ainvoke(initial_state)
        
        response = {
            "question": result.get("question", ""),
            "answer": result.get("answer", ""),
            "sources": result.get("sources", []),
            "reflection": result.get("reflection", ""),
            "queries_used": result.get("queries", []),
            "loop_count": result.get("loop_count", 0),
            "research_complete": True,
            "run_id": run_id,
            "duration_seconds": (datetime.now() - start_time).total_seconds()
        }
        
        return json.dumps(response, default=str, ensure_ascii=False, indent=2)
        
    except Exception as e:
        error_response = {
            "error": str(e),
            "question": query,
            "research_complete": False,
            "run_id": run_id,
            "duration_seconds": (datetime.now() - start_time).total_seconds()
        }
        
        return json.dumps(error_response, default=str, ensure_ascii=False, indent=2)
 
@mcp.resource(uri="config://research_agent_info")
def get_research_agent_info() -> str:
    """Get information about the research agent capabilities."""
    info = {
        "name": "Research Agent",
        "description": "AI-powered research tool using LangGraph and Qwen3",
        "capabilities": [
            "Multi-step web research",
            "Query generation and refinement",
            "Source verification and citation",
            "Research quality reflection",
            "Comprehensive answer generation",
            "LangSmith tracing and monitoring"
        ],
        "parameters": {
            "query": {
                "type": "string",
                "description": "The research question or topic",
                "required": True
            },
            "max_loops": {
                "type": "integer",
                "description": "Maximum research iterations",
                "default": 3,
                "min": 1,
                "max": 10
            }
        },
        "langsmith_enabled": langsmith_client is not None,
        "langsmith_project": os.getenv("LANGSMITH_PROJECT", "mcp-research-agent")
    }
    return json.dumps(info, default=str, ensure_ascii=False, indent=2)
 
def create_starlette_app(mcp_server: Server, *, debug: bool = False) -> Starlette:
    """Create a Starlette application with SSE support."""
    sse = SseServerTransport("/messages/")
 
    async def handle_sse(request: Request) -> None:
        async with sse.connect_sse(
            request.scope,
            request.receive,
            request._send,  # noqa: SLF001
        ) as (read_stream, write_stream):
            await mcp_server.run(
                read_stream,
                write_stream,
                mcp_server.create_initialization_options(),
            )
 
    # Define CORS middleware
    middleware = [
        Middleware(
            CORSMiddleware,
            allow_origins=['*'],  # Allow all origins (restrict this in production!)
            allow_credentials=True,
            allow_methods=['*'],  # Allow all methods
            allow_headers=['*'],  # Allow all headers
            expose_headers=['*'],  # Expose all headers
        )
    ]
 
    return Starlette(
        debug=debug,
        routes=[
            Route("/sse", endpoint=handle_sse),
            Mount("/messages/", app=sse.handle_post_message),
        ],
        middleware=middleware  # Add CORS middleware
    )
 
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run Research Agent MCP SSE-based server')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8081, help='Port to listen on')
    args = parser.parse_args()
 
    # Get the MCP server instance
    mcp_server = mcp._mcp_server  # noqa: WPS437
 
    # Create and run the Starlette application
    starlette_app = create_starlette_app(mcp_server, debug=True)
    
    print(f"Starting Research Agent MCP server on {args.host}:{args.port}")
    print("Available tool: research_tool")
    print("SSE endpoint: /sse")
    print(f"LangSmith tracing: {'Enabled' if langsmith_client else 'Disabled'}")
    
    uvicorn.run(starlette_app, host=args.host, port=args.port)
 