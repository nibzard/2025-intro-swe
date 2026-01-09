# Backend Dockerfile for LLM Answer Watcher API
# Python 3.12 + FastAPI + uvicorn

FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY llm_answer_watcher/ ./llm_answer_watcher/
COPY pyproject.toml .
COPY README.md .

# Install the package in editable mode
RUN pip install --no-cache-dir -e .

# Create output directory for SQLite and results
RUN mkdir -p /app/output

# Expose the API port
EXPOSE 8000

# Run the FastAPI server
CMD ["uvicorn", "llm_answer_watcher.api:app", "--host", "0.0.0.0", "--port", "8000"]
