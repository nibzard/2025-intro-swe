# Scientific Programming Development Container

This directory contains the configuration for a comprehensive scientific programming development environment designed for university education.

## 🎯 Purpose

This DevContainer provides students with a complete, reproducible environment for scientific programming courses, eliminating setup time and ensuring everyone works with the same tools and dependencies.

## 📁 Files Overview

### `devcontainer.json`
Main configuration file that defines:
- **Base Image**: Python 3.13 with scientific computing capabilities
- **Features**: UV package manager, Docker-in-Docker, enhanced shell
- **VS Code Extensions**: 19+ extensions for scientific programming
- **Port Forwarding**: Pre-configured for Jupyter, web apps, and dashboards
- **Environment Settings**: Optimized for data science workflows

### `setup.sh`
Automated initialization script that:
- Installs core scientific Python packages
- Sets up Jupyter Lab with extensions
- Creates educational templates and sample datasets
- Configures development tools (Black, Flake8, MyPy)
- Generates project structure and documentation

## 🚀 Quick Start for Students

### Option 1: GitHub Codespaces (Recommended)
1. Open this repository in GitHub
2. Click "Code" → "Codespaces" → "Create codespace"
3. Wait for environment to build (~2-3 minutes)
4. Start working immediately!

### Option 2: VS Code with Dev Containers
1. Clone this repository locally
2. Open in VS Code
3. Install "Dev Containers" extension
4. Press `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
5. Wait for setup to complete

## 🛠️ What's Included

### Core Scientific Stack
- **NumPy** (`1.24+`): Numerical computing and array operations
- **SciPy** (`1.10+`): Scientific algorithms and optimization
- **Pandas** (`2.0+`): Data manipulation and analysis
- **Matplotlib** (`3.7+`): Plotting and visualization
- **Seaborn** (`0.12+`): Statistical data visualization
- **Scikit-Learn** (`1.3+`): Machine learning algorithms

### Interactive Computing
- **Jupyter Lab**: Advanced notebook interface
- **IPython**: Enhanced Python REPL
- **Marimo**: Reactive notebooks with AI integration
- **Jupyter Extensions**: Plotly widgets, collaborative features

### Web & Visualization
- **FastAPI**: Modern web API framework
- **Streamlit**: Quick data applications
- **Gradio**: Machine learning demos
- **Dash**: Interactive dashboards
- **Plotly**: Interactive visualizations
- **Altair**: Statistical visualization
- **Bokeh**: Interactive plots

### Development Tools
- **UV**: Fast Python package manager (10x faster than pip)
- **Black**: Code formatting
- **Flake8**: Linting
- **MyPy**: Type checking
- **Pre-commit**: Git hooks
- **pytest**: Testing framework

### AI Integration
- **Google Generative AI**: Gemini API access
- **Anthropic**: Claude API access
- **OpenAI**: GPT API access

## 📂 Project Structure Created

```
/workspaces/
├── data/                    # Dataset storage
│   ├── student_grades.csv   # Sample educational data
│   └── climate_data.csv     # Sample time series data
├── notebooks/               # Jupyter notebooks
├── reports/                 # Generated reports
├── figures/                 # Generated plots and figures
├── models/                  # Trained ML models
└── templates/               # Code and notebook templates
    ├── notebook_template.ipynb
    └── python_template.py
```

## 🔧 Development Environment

### VS Code Extensions
The container automatically installs these educational extensions:
- **Jupyter**: Full notebook support
- **Python Docstring Generator**: Automatic documentation
- **GitLens**: Enhanced Git capabilities
- **Test Explorer**: Integrated testing
- **Docker**: Container management
- **Plotly**: Interactive charts in VS Code

### Port Forwarding
Pre-configured ports for common scientific applications:
- **8888**: Jupyter Lab
- **8000**: FastAPI applications
- **3000**: React/Frontend applications
- **5000**: Flask applications
- **8050**: Dash applications
- **7860**: Gradio applications

## 📚 Using the Environment

### Starting Jupyter Lab
```bash
# From the terminal in VS Code or Codespaces
uv run jupyter lab --ip=0.0.0.0 --port=8888 --no-browser
```

### Creating a New Project
```bash
# Use the provided template
cp templates/python_template.py my_analysis.py
cp templates/notebook_template.ipynb my_analysis.ipynb
```

### Installing New Packages
```bash
# Use UV for fast installation
uv add new_package_name

# For Jupyter extensions
uv run jupyter labextension install extension_name
```

### Running Tests
```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=my_module
```

## 🎓 Educational Features

### Sample Datasets
The environment includes two educational datasets:

1. **Student Grades** (`data/student_grades.csv`):
   - 100 student records with assignment, midterm, and final exam scores
   - Perfect for learning statistics, visualization, and basic ML

2. **Climate Data** (`data/climate_data.csv`):
   - Daily temperature, precipitation, humidity, and wind data
   - Ideal for time series analysis and seasonal patterns

### Templates
- **Notebook Template**: Structured format for scientific notebooks
- **Python Script Template**: Educational script structure with learning objectives

### Code Quality
Automatic formatting and linting ensure students learn professional coding practices:
- Code formatted with Black on save
- Linting with Flake8 for common issues
- Type checking with MyPy for better code reliability

## 🔍 Troubleshooting

### Common Issues
1. **Port already in use**: Change the port number in your command
2. **Out of memory**: Restart the container or close unused applications
3. **Package not found**: Use `uv add package_name` instead of pip
4. **Jupyter won't start**: Check if all dependencies are installed

### Getting Help
- Check the terminal output for error messages
- Review `README_devcontainer.md` in the workspace root
- Use `uv pip list` to verify installed packages
- Restart the container if needed: `Ctrl+Shift+P` → "Dev Containers: Rebuild Container"

## 📖 Learning Resources

### Built-in Documentation
- `README_devcontainer.md`: Comprehensive environment guide
- Template files: Include best practices and examples
- Sample data scripts: Demonstrate data handling techniques

### External Resources
- [Python for Data Analysis Handbook](https://jakevdp.github.io/PythonDataScienceHandbook/)
- [Scikit-Learn Documentation](https://scikit-learn.org/stable/)
- [Jupyter Documentation](https://jupyter.org/documentation)
- [UV Documentation](https://docs.astral.sh/uv/)

## 🔄 Updates and Maintenance

### Updating Packages
```bash
# Update all packages
uv sync --upgrade

# Update specific package
uv add package_name@latest
```

### Adding New Extensions
Edit `devcontainer.json` and add the extension ID to the `extensions` array, then rebuild the container.

### Customizing the Environment
1. Edit `devcontainer.json` for container configuration
2. Edit `setup.sh` for package installation
3. Rebuild the container to apply changes

## 🎯 Learning Outcomes

Students using this environment will learn:
- **Professional development practices** with modern tools
- **Reproducible research** through containerization
- **Collaborative coding** with Git and version control
- **Scientific computing** with industry-standard libraries
- **Data visualization** and communication skills
- **Machine learning** fundamentals with scikit-learn
- **Web development** for data applications

## 📝 Notes for Instructors

### Customization
- Modify `setup.sh` to add course-specific packages
- Update templates to match course requirements
- Add custom datasets to the `data/` directory

### Assessment
- All student work is automatically formatted and linted
- Pre-commit hooks ensure code quality standards
- Containerized environment eliminates "it works on my machine" issues

### Scalability
- GitHub Codespaces provides free usage for educational purposes
- VS Code with Dev Containers works on local machines
- UV package manager ensures fast, reliable dependency management

This environment represents best practices from leading universities and provides students with a professional-grade scientific programming setup that prepares them for industry work.
