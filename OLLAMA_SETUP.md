# Ollama Setup for Qwen 3 8B

This application is configured to use **Qwen 3 8B** model running locally through **Ollama**.

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [https://ollama.ai](https://ollama.ai)

## Setup Instructions

### 1. Install Qwen 3 8B Model
```bash
ollama pull qwen3:8b
```

### 2. Verify Installation
```bash
ollama list
```
You should see `qwen3:8b` in the list of installed models.

### 3. Test the Model
```bash
ollama run qwen3:8b "Hello, how are you?"
```

### 4. Start Ollama Server (if not already running)
```bash
ollama serve
```

The Ollama server will run on `http://localhost:11434` by default.

## Configuration

### Default Endpoint
The application uses `http://localhost:11434/v1` as the default Ollama endpoint.

### Custom Endpoint (Optional)
If you need to use a different endpoint, you can set it in your browser's localStorage:

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run this command:
```javascript
localStorage.setItem('OLLAMA_ENDPOINT', 'http://your-custom-endpoint:port/v1');
```
4. Refresh the page

## Model Information

- **Model**: Qwen 3 8B
- **Provider**: Alibaba Cloud
- **Size**: ~8 billion parameters
- **Capabilities**: Local inference, reasoning, coding, efficient performance
- **Requirements**: ~8GB RAM minimum for smooth operation

## Troubleshooting

### Model Not Loading
1. Ensure Ollama is running: `ollama serve`
2. Verify the model is installed: `ollama list`
3. Check if the endpoint is accessible: `curl http://localhost:11434/api/tags`

### Performance Issues
1. Ensure you have sufficient RAM (8GB+ recommended)
2. Close other memory-intensive applications
3. Consider using a smaller model if performance is poor

### Connection Issues
1. Check if Ollama server is running on the correct port
2. Verify firewall settings
3. Try restarting the Ollama service

## Benefits of Local Inference

- **Privacy**: Your data never leaves your machine
- **Speed**: No network latency for API calls
- **Cost**: No API usage fees
- **Offline**: Works without internet connection
- **Control**: Full control over the model and inference parameters

## Next Steps

Once Ollama is set up and running with Qwen 3 8B, you can start using the chat interface. The model picker will show "Qwen 3 8B (Local)" as the available option.
