#!/bin/bash
# Clean demo for social media

source .venv/bin/activate

clear

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         LLM Answer Watcher - Brand Monitoring Demo          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
sleep 2

echo "👉 Track how LLMs recommend YOUR brand vs competitors"
echo ""
sleep 2

echo "📋 Step 1: Validate configuration"
echo ""
sleep 1
llm-answer-watcher validate --config demo.config.yaml
echo ""
sleep 3

echo "🚀 Step 2: Run brand monitoring across LLMs"
echo ""
sleep 1
llm-answer-watcher run --config demo.config.yaml
echo ""
sleep 2

echo "✅ Done! Check demo-output/ for results"
echo ""
echo "   📊 HTML report with visualizations"
echo "   💾 SQLite database for historical trends"
echo "   📝 JSON files with raw + parsed data"
echo ""
