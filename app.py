from flask import Flask, render_template, request, jsonify
from models.analyzer import StudentAnalyzer
import pandas as pd
import traceback

app = Flask(__name__)
analyzer = StudentAnalyzer()
analyzer.load_data()

@app.route('/')
def home():
    try:
        classes = analyzer.get_class_list()
        students = analyzer.data[['student_id', 'student_name', 'class']].to_dict('records')
        return render_template('dashboard.html', classes=classes, students=students)
    except Exception as e:
        return f"Error loading dashboard: {str(e)}", 500

@app.route('/student/<student_id>')
def student_analysis(student_id):
    try:
        if not student_id:
            return jsonify({'success': False, 'error': 'Student ID is required'}), 400

        # Get student performance data
        performance = analyzer.get_student_performance(student_id)
        
        # Get analysis of weak and strong subjects
        analysis = analyzer.identify_weak_subjects(student_id)
        
        # Get personalized recommendations
        suggestions = analyzer.get_recommendations(student_id)
        
        return jsonify({
            'success': True,
            'performance': performance,
            'analysis': analysis,
            'suggestions': suggestions
        })
    except Exception as e:
        app.logger.error(f"Error in student analysis: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/class/<class_id>')
def class_analysis(class_id):
    try:
        if not class_id:
            return jsonify({'success': False, 'error': 'Class ID is required'}), 400

        insights = analyzer.get_class_insights(class_id)
        return jsonify({
            'success': True,
            'insights': insights
        })
    except Exception as e:
        app.logger.error(f"Error in class analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/upload', methods=['POST'])
def upload_data():
    try:
        file = request.files['file']
        if not file:
            return jsonify({'success': False, 'error': 'No file provided'}), 400

        df = pd.read_csv(file)
        df.to_csv('data/detailed_student_data.csv', index=False)
        analyzer.load_data()  # Reload the data
        return jsonify({'success': True, 'message': 'Data uploaded successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
