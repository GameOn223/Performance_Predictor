// Chart.js configuration defaults
Chart.defaults.font.family = "'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif";
Chart.defaults.color = '#2c3e50';
Chart.defaults.layout.padding = 20;

// Store active charts to destroy them before creating new ones
let activeCharts = {};

// Load class analysis
async function loadClassAnalysis() {
    const classId = document.getElementById('classSelect').value;
    if (!classId) {
        document.getElementById('classInsights').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/class/${classId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load class data');
        }
        
        const data = await response.json();
        if (data.success) {
            displayClassInsights(data.insights);
            document.getElementById('classInsights').style.display = 'block';
        } else {
            throw new Error(data.error || 'Failed to load class analysis');
        }
    } catch (error) {
        console.error('Error loading class analysis:', error);
        alert('Error loading class analysis: ' + error.message);
        document.getElementById('classInsights').style.display = 'none';
    }
}

// Load student analysis
async function loadStudentAnalysis() {
    const studentId = document.getElementById('studentSelect').value;
    if (!studentId) {
        document.getElementById('studentAnalysis').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/student/${studentId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to load student data (${response.status})`);
        }
        
        const data = await response.json();
        if (data.success && data.performance) {
            displayStudentAnalysis(data.performance, data.analysis, data.suggestions);
            document.getElementById('studentAnalysis').style.display = 'block';
        } else {
            throw new Error(data.error || 'Invalid student data received');
        }
    } catch (error) {
        console.error('Error loading student analysis:', error);
        alert('Error loading student analysis: ' + error.message);
        document.getElementById('studentAnalysis').style.display = 'none';
    }
}

// Display class insights
function displayClassInsights(insights) {
    if (!insights) {
        console.error('No insights data provided');
        return;
    }

    try {
        // Display class statistics
        const statsHtml = `
            <div class="stat-item">
                <span>Total Students:</span>
                <strong>${insights.total_students}</strong>
            </div>
            <div class="stat-item">
                <span>Average Attendance:</span>
                <strong>${insights.average_attendance.toFixed(1)}%</strong>
            </div>
        `;
        document.getElementById('classStats').innerHTML = statsHtml;

        // Display performance distribution chart
        if (insights.performance_distribution) {
            createPerformanceChart(insights.performance_distribution);
        }

        // Display subject-wise performance chart
        if (insights.subject_performance) {
            createSubjectChart(insights.subject_performance);
        }

        // Display areas of concern with student names
        let concernAreas = '';
        Object.entries(insights.subject_performance || {}).forEach(([subject, data]) => {
            if (data.weak_students && data.weak_students.length > 0) {
                concernAreas += `
                    <div class="recommendation-item">
                        <div class="subject-header">
                            <strong>${subject.charAt(0).toUpperCase() + subject.slice(1)}</strong>
                            <span class="subject-avg">(Class Average: ${data.average_score.toFixed(1)}%)</span>
                        </div>
                        <div class="weak-students-list">
                            <p>Students needing attention:</p>
                            ${data.weak_students.map(student => `
                                <div class="student-entry">
                                    ${student.name} (${student.score}%)
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        document.getElementById('concernAreas').innerHTML = concernAreas || 
            '<div class="recommendation-item">No major concerns identified</div>';
    } catch (error) {
        console.error('Error displaying class insights:', error);
        alert('Error displaying class insights: ' + error.message);
    }
}

// Display student analysis
function displayStudentAnalysis(performance, analysis, suggestions) {
    if (!performance) {
        console.error('No performance data provided');
        return;
    }

    try {
        // Display student information
        const studentInfo = `
            <div class="stat-item">
                <span>Name:</span>
                <strong>${performance.name}</strong>
            </div>
            <div class="stat-item">
                <span>Class:</span>
                <strong>${performance.class}</strong>
            </div>
            <div class="stat-item">
                <span>Attendance:</span>
                <strong>${performance.attendance}%</strong>
            </div>
        `;
        document.getElementById('studentInfo').innerHTML = studentInfo;

        // Initialize both views
        populateTableView(performance.subjects);
        createStudentSubjectsChart(performance.subjects);
        createProgressChart(performance.subjects);

        // Display predictions if available
        if (performance.predictions) {
            displayPredictions(performance.predictions);
        }

        // Display recommendations
        const recommendationsHtml = (suggestions || []).map(suggestion => 
            `<div class="recommendation-item">${suggestion}</div>`
        ).join('') || '<div class="recommendation-item">No specific recommendations at this time.</div>';
        
        document.getElementById('recommendations').innerHTML = recommendationsHtml;
        
        // Show the analysis section
        document.getElementById('studentAnalysis').style.display = 'block';
    } catch (error) {
        console.error('Error displaying student analysis:', error);
        alert('Error displaying student analysis: ' + error.message);
    }
}

// Populate table view with student data
function populateTableView(subjects) {
    const tableBody = document.getElementById('performanceTableBody');
    tableBody.innerHTML = '';

    Object.entries(subjects).forEach(([subject, data]) => {
        // Get individual test scores
        const patT1 = parseFloat(data.pat_t1 || 0).toFixed(1);
        const satT1 = parseFloat(data.sat_t1 || 0).toFixed(1);
        const patT2 = parseFloat(data.pat_t2 || 0).toFixed(1);
        const satT2 = parseFloat(data.sat_t2 || 0).toFixed(1);

        // Calculate averages
        const term1Avg = ((parseFloat(patT1) + parseFloat(satT1)) / 2).toFixed(1);
        const term2Avg = ((parseFloat(patT2) + parseFloat(satT2)) / 2).toFixed(1);
        const overallAvg = ((parseFloat(term1Avg) + parseFloat(term2Avg)) / 2).toFixed(1);
        
        // Calculate improvement/decline
        const improvement = (parseFloat(term2Avg) - parseFloat(term1Avg)).toFixed(1);
        const statusClass = improvement > 0 ? 'improving' : 
                          improvement < 0 ? 'declining' : 'stable';
        const statusText = improvement > 0 ? 'Improving' : 
                         improvement < 0 ? 'Declining' : 'Stable';

        const row = `
            <tr>
                <td>${subject.charAt(0).toUpperCase() + subject.slice(1)}</td>
                <td>${patT1}</td>
                <td>${satT1}</td>
                <td><strong>${term1Avg}</strong></td>
                <td>${patT2}</td>
                <td>${satT2}</td>
                <td><strong>${term2Avg}</strong></td>
                <td><strong>${overallAvg}</strong></td>
                <td class="status-${statusClass}">${statusText} (${Math.abs(improvement)}%)</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Handle view toggle
document.addEventListener('DOMContentLoaded', function() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const views = document.querySelectorAll('.view-content');

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewType = button.dataset.view;
            
            // Update button states
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update view visibility
            views.forEach(view => {
                view.style.display = view.id === `${viewType}View` ? 'block' : 'none';
            });
        });
    });
});

// Display predictions
function displayPredictions(predictions) {
    const { final_marks, attendance } = predictions;
    
    // Create predictions section HTML
    const predictionsSection = `
        <div class="predictions-grid">
            <div class="insight-card">
                <h3>Predicted Final Marks</h3>
                <div class="predictions-list">
                    ${Object.entries(final_marks)
                        .map(([subject, data]) => `
                            <div class="prediction-item ${data.trend}">
                                <div class="subject-name">${subject.charAt(0).toUpperCase() + subject.slice(1)}</div>
                                <div class="predicted-score">
                                    <span>Predicted: ${data.predicted_score}%</span>
                                    <div class="confidence">Confidence: ${data.confidence}%</div>
                                </div>
                                <div class="trend-indicator">
                                    <span class="trend-${data.trend}">${data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}</span>
                                </div>
                                <div class="contributing-factors">
                                    <p>Key Factors:</p>
                                    ${data.contributing_factors
                                        .filter(f => f.importance > 10)
                                        .map(factor => `
                                            <div class="factor-item">
                                                <span>${factor.factor}</span>
                                                <div class="factor-bar" style="width: ${factor.importance}%"></div>
                                                <span>${factor.importance}%</span>
                                            </div>
                                        `).join('')}
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
            <div class="insight-card">
                <h3>Attendance Forecast</h3>
                <div class="predictions-list">
                    <div class="prediction-item ${attendance.trend}">
                        <div class="prediction-header">Future Attendance Prediction</div>
                        <div class="predicted-score">
                            <span>Current: ${attendance.current_attendance}%</span>
                            <span>Predicted: ${attendance.predicted_attendance}%</span>
                        </div>
                        <div class="risk-level risk-${attendance.risk_level}">
                            Risk Level: ${attendance.risk_level.toUpperCase()}
                        </div>
                        <div class="trend-indicator">
                            <span class="trend-${attendance.trend}">${attendance.trend.charAt(0).toUpperCase() + attendance.trend.slice(1)}</span>
                            ${attendance.performance_correlation > 0 ? 
                                `<div class="correlation">Performance correlation: ${attendance.performance_correlation}</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('predictionsSection').innerHTML = predictionsSection;
}

// Create performance distribution chart
function createPerformanceChart(distribution) {
    if (activeCharts.performance) {
        activeCharts.performance.destroy();
    }

    const ctx = document.getElementById('performanceChart').getContext('2d');
    activeCharts.performance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
            datasets: [{
                data: [
                    distribution.excellent,
                    distribution.good,
                    distribution.average,
                    distribution.needs_improvement
                ],
                backgroundColor: [
                    '#27ae60',
                    '#4a90e2',
                    '#f39c12',
                    '#e74c3c'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create subject-wise performance chart
function createSubjectChart(subjectData) {
    if (activeCharts.subjects) {
        activeCharts.subjects.destroy();
    }

    const subjects = Object.keys(subjectData);
    const averages = subjects.map(subject => subjectData[subject].average_score);

    const ctx = document.getElementById('subjectChart').getContext('2d');
    activeCharts.subjects = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
            datasets: [{
                label: 'Average Score',
                data: averages,
                backgroundColor: '#4a90e2'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Create student subjects chart
function createStudentSubjectsChart(subjectData) {
    if (activeCharts.studentSubjects) {
        activeCharts.studentSubjects.destroy();
    }

    const subjects = Object.keys(subjectData);
    const averages = subjects.map(subject => subjectData[subject].average_score);

    const ctx = document.getElementById('studentSubjectsChart').getContext('2d');
    activeCharts.studentSubjects = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
            datasets: [{
                label: 'Current Performance',
                data: averages,
                backgroundColor: 'rgba(74, 144, 226, 0.2)',
                borderColor: '#4a90e2',
                pointBackgroundColor: '#4a90e2'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Create progress chart
function createProgressChart(subjectData) {
    if (activeCharts.progress) {
        activeCharts.progress.destroy();
    }

    const subjects = Object.keys(subjectData);
    const term1Data = subjects.map(subject => subjectData[subject].term1_average);
    const term2Data = subjects.map(subject => subjectData[subject].term2_average);

    const ctx = document.getElementById('progressChart').getContext('2d');
    activeCharts.progress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
            datasets: [
                {
                    label: 'Term 1',
                    data: term1Data,
                    borderColor: '#f39c12',
                    fill: false
                },
                {
                    label: 'Term 2',
                    data: term2Data,
                    borderColor: '#27ae60',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}
