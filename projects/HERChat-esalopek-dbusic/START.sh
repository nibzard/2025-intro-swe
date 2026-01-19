#!/bin/bash

echo "🚀 Starting HERChat..."
echo ""
echo "Opening 2 terminal windows..."
echo ""

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start backend in a new terminal window (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Starting Backend on port 5001..."
  osascript -e "tell app \"Terminal\" to do script \"cd '$DIR/BE' && npm run dev\""
  
  # Wait a moment for backend to start
  sleep 3
  
  echo "Starting Frontend on port 3000..."
  osascript -e "tell app \"Terminal\" to do script \"cd '$DIR/FE' && npm start\""
  
  echo ""
  echo "✅ Servers starting!"
  echo ""
  echo "Backend:  http://localhost:5001"
  echo "Frontend: http://localhost:3000"
  echo ""
  echo "Frontend will open automatically in your browser."
  echo "Check the terminals to see log output."
  
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "Starting Backend..."
  gnome-terminal -- bash -c "cd '$DIR/BE' && npm run dev; exec bash"
  
  sleep 3
  
  echo "Starting Frontend..."
  gnome-terminal -- bash -c "cd '$DIR/FE' && npm start; exec bash"
  
else
  echo "Unsupported OS. Please run manually:"
  echo ""
  echo "Terminal 1:"
  echo "  cd $DIR/BE"
  echo "  npm run dev"
  echo ""
  echo "Terminal 2:"
  echo "  cd $DIR/FE"
  echo "  npm start"
fi
