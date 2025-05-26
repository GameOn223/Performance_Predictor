// Handle form submission for predictions
document.getElementById('predictionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const patScore = document.getElementById('patScore').value;
    const satScore = document.getElementById('satScore').value;
    const attendance = document.getElementById('attendance').value;

    const data = {
        pat_score: parseFloat(patScore),
        sat_score: parseFloat(satScore),
        attendance_percentage: parseFloat(attendance)
    };

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            displayResults(result.prediction, result.recommendations);
        } else {
            alert('Error making prediction: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error making prediction. Please try again.');
    }
});

// Handle file upload
async function uploadData() {
    const fileInput = document.getElementById('dataFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file first.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Data uploaded successfully!');
        } else {
            alert('Error uploading data: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error uploading data. Please try again.');
    }
}

// Display prediction results
function displayResults(performance, recommendations) {
    const resultsSection = document.getElementById('results');
    const performanceLevel = document.getElementById('performanceLevel');
    const recommendationsList = document.getElementById('recommendationsList');

    // Show results section
    resultsSection.style.display = 'block';

    // Update performance level
    performanceLevel.textContent = performance.toUpperCase();
    performanceLevel.className = 'performance-badge performance-' + performance.toLowerCase();

    // Update recommendations
    recommendationsList.innerHTML = '';
    recommendations.forEach(recommendation => {
        const li = document.createElement('li');
        li.textContent = recommendation;
        recommendationsList.appendChild(li);
    });

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}
