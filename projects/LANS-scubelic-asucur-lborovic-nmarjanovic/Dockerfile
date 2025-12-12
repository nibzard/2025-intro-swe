# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy package.json and install dependencies
COPY frontend/package.json ./frontend/
# Create an empty package-lock.json to satisfy npm ci, if no lock file is present
RUN if [ ! -f frontend/package-lock.json ]; then echo '{ "version": 1, "lockfileVersion": 1 }' > frontend/package-lock.json; fi
RUN cd frontend && npm install --ci --silent

# Copy the rest of the frontend source code
COPY frontend/ ./frontend/

# Build the frontend
RUN cd frontend && npm run build

# Stage 2: Build the Python backend
FROM python:3.11-slim AS backend

# Set the working directory
WORKDIR /app

# Install dependencies
# We use uv for faster installation
RUN pip install uv
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

# Copy the application code
COPY llm_answer_watcher ./llm_answer_watcher
COPY server.py .

# Copy example configs to be used by the server
COPY examples ./examples

# Copy the built frontend from the builder stage
COPY --from=frontend-builder /app/frontend/build ./build

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the application
CMD ["python", "-u", "server.py"]
