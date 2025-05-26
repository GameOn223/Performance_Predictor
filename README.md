# Student Performance Analysis and Prediction System

A machine learning-based system that analyzes student performance using PAT (Periodic Assessment Tests), SAT (Summative Assessment Tests), and attendance data to provide personalized educational insights and predictions.

## Table of Contents
1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Installation](#installation)
5. [System Architecture](#system-architecture)
6. [Data Structure](#data-structure)
7. [Machine Learning Implementation](#machine-learning-implementation)
8. [API Reference](#api-reference)
9. [Usage Guide](#usage-guide)

## Features

### Core Features
- **Performance Prediction**: ML-based prediction of student performance in each subject
- **Attendance Analysis**: Prediction of future attendance patterns and risk assessment
- **Class-wise Analytics**: Comprehensive analysis of class performance and trends
- **Student-wise Analysis**: Detailed individual student performance tracking
- **Interactive Visualization**: Both graphical and tabular data representation
- **Personalized Recommendations**: AI-driven recommendations for improvement

### Key Capabilities
- Real-time performance monitoring
- Subject-wise strength/weakness analysis
- Performance trend visualization
- Risk level assessment
- Data-driven educational recommendations
- Comparative analysis across terms

## Technology Stack

### Backend
- **Python 3.10+**
- **Flask**: Web framework
- **scikit-learn**: Machine learning implementation
- **pandas**: Data processing
- **numpy**: Numerical computations

### Frontend
- **JavaScript**: Interactive UI components
- **Chart.js**: Data visualization
- **HTML5/CSS3**: Modern responsive design

### Database
- CSV-based data storage (can be extended to SQL databases)

## Project Structure

```
app.py                  # Main Flask application
data/                   # Data directory
├── detailed_student_data.csv   # Primary dataset
├── sample_student_data.csv     # Sample data for testing
└── student_data.csv           # Training data
models/                # Core logic
├── analyzer.py       # Data analysis implementation
└── predictor.py      # ML model implementation
static/               # Frontend assets
├── css/
│   └── style.css    # Application styling
└── js/
    ├── dashboard.js  # Dashboard functionality
    └── main.js      # Core frontend logic
templates/            # HTML templates
├── dashboard.html   # Main dashboard view
└── index.html      # Landing page
```

## Installation

1. Create a virtual environment:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Install dependencies:
```powershell
pip install -r requirements.txt
```

3. Run the application:
```powershell
python app.py
```

## System Architecture

### Core Components

#### 1. StudentAnalyzer (analyzer.py)
Main class responsible for data analysis and insights generation.

Key Methods:
- **load_data()**: Loads and preprocesses student data
- **get_class_list()**: Retrieves available classes
- **predict_final_marks(student_id)**: Generates ML-based performance predictions
- **predict_future_attendance(student_id)**: Predicts attendance patterns
- **get_student_performance(student_id)**: Retrieves comprehensive student data
- **get_class_insights(class_id)**: Generates class-level analytics
- **identify_weak_subjects(student_id)**: Analyzes subject-wise performance
- **get_recommendations(student_id)**: Generates personalized recommendations

#### 2. StudentPredictor (predictor.py)
Handles machine learning model training and predictions.

Key Methods:
- **train()**: Trains ML models for each subject
- **predict()**: Generates predictions using trained models
- **get_recommendations()**: Provides ML-based recommendations
- **_calculate_confidence()**: Determines prediction confidence levels
- **_determine_trend()**: Analyzes performance trends
- **_get_contributing_factors()**: Identifies key performance factors

### Data Flow
1. Data Loading → Preprocessing → Model Training
2. User Request → Data Analysis → ML Prediction → Result Generation
3. Frontend Display → Interactive Visualization → User Interaction

## Data Structure

### Student Data Format
```csv
student_id,student_name,class,pat_subject_t1,sat_subject_t1,pat_subject_t2,sat_subject_t2,attendance_percentage
```

### Key Fields:
- **PAT Scores**: Periodic Assessment Test scores (Term 1 & 2)
- **SAT Scores**: Summative Assessment Test scores (Term 1 & 2)
- **Attendance**: Student attendance percentage
- **Subject Data**: Individual scores for English, Math, Science, Social, Computer

## Machine Learning Implementation

### Model Architecture
- **Algorithm**: Random Forest Regressor
- **Features**: Previous test scores, attendance patterns
- **Target**: Performance prediction per subject
- **Validation**: Cross-validation with confidence scoring

### Prediction Process
1. **Data Preparation**:
   - Feature scaling using StandardScaler
   - Historical performance analysis
   - Attendance pattern evaluation

2. **Model Training**:
   - Subject-wise model training
   - Feature importance calculation
   - Confidence score computation

3. **Prediction Generation**:
   - Performance prediction
   - Trend analysis
   - Contributing factor identification

### Confidence Calculation
- Based on prediction variance across trees
- Considers historical data consistency
- Adjusts for attendance patterns

## API Reference

### Flask Routes

#### 1. GET /student/<student_id>
Returns complete student analysis including:
- Basic information
- Subject-wise performance
- Predictions
- Recommendations

#### 2. GET /class/<class_id>
Returns class-level insights including:
- Performance distribution
- Subject-wise analytics
- Areas of concern

#### 3. POST /upload
Handles data upload and processing

## Usage Guide

### Dashboard Navigation

1. **Class Selection**:
   - Choose class from dropdown
   - View class-level insights
   - Access performance distribution

2. **Student Analysis**:
   - Select student from filtered list
   - Toggle between graph/table views
   - View detailed performance data

3. **Performance Tracking**:
   - Monitor subject-wise progress
   - View prediction confidence
   - Access contributing factors

### Interpreting Results

1. **Performance Predictions**:
   - Score predictions with confidence levels
   - Trend indicators (Improving/Declining/Stable)
   - Contributing factors analysis

2. **Attendance Analysis**:
   - Risk level assessment
   - Correlation with performance
   - Future attendance predictions

3. **Recommendations**:
   - Subject-specific suggestions
   - Priority areas for improvement
   - Attendance-related guidance

