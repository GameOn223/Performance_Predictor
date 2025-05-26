import pandas as pd
import numpy as np
from .predictor import StudentPredictor

class StudentAnalyzer:
    def __init__(self):
        self.data = None
        self.subjects = ['english', 'maths', 'science', 'social', 'computer']
        self.predictor = StudentPredictor()

    def load_data(self, data_path='data/detailed_student_data.csv'):
        try:
            self.data = pd.read_csv(data_path)
            # Train the predictor with the loaded data
            self.predictor.train(data_path)
            return True
        except Exception as e:
            print(f"Error loading data: {str(e)}")
            return False

    def get_class_list(self):
        """Get the list of unique classes from the data"""
        try:
            if self.data is None:
                raise ValueError("No data loaded")
            return sorted(self.data['class'].unique())
        except Exception as e:
            print(f"Error getting class list: {str(e)}")
            return []

    def predict_final_marks(self, student_id):
        try:
            student = self.data[self.data['student_id'] == student_id].iloc[0]
            
            # Prepare student data for prediction
            student_data = {
                'attendance_percentage': float(student['attendance_percentage'])
            }
            
            # Add test scores for each subject
            for subject in self.subjects:
                student_data[f'pat_{subject}_t1'] = float(student[f'pat_{subject}_t1'])
                student_data[f'sat_{subject}_t1'] = float(student[f'sat_{subject}_t1'])
                student_data[f'pat_{subject}_t2'] = float(student[f'pat_{subject}_t2'])
                student_data[f'sat_{subject}_t2'] = float(student[f'sat_{subject}_t2'])
            
            # Get ML predictions
            return self.predictor.predict(student_data)

        except Exception as e:
            raise Exception(f"Error predicting final marks: {str(e)}")

    def predict_future_attendance(self, student_id):
        try:
            student = self.data[self.data['student_id'] == student_id].iloc[0]
            current_attendance = float(student['attendance_percentage'])
            
            # Calculate performance trends
            subject_trends = []
            for subject in self.subjects:
                term1_avg = (float(student[f'pat_{subject}_t1']) + 
                           float(student[f'sat_{subject}_t1'])) / 2
                term2_avg = (float(student[f'pat_{subject}_t2']) + 
                           float(student[f'sat_{subject}_t2'])) / 2
                subject_trends.append(term2_avg - term1_avg)
            
            # Average performance trend
            avg_trend = sum(subject_trends) / len(subject_trends)
            
            # Predict attendance
            attendance_change = avg_trend * 0.15  # Performance trend affects attendance
            predicted_attendance = max(70, min(100, current_attendance + attendance_change))
            
            # Determine risk level
            risk_level = 'low'
            if predicted_attendance < 75:
                risk_level = 'high'
            elif predicted_attendance < 85:
                risk_level = 'medium'
            
            return {
                'current_attendance': current_attendance,
                'predicted_attendance': round(predicted_attendance, 1),
                'risk_level': risk_level,
                'performance_correlation': round(abs(avg_trend), 2),
                'trend': 'improving' if avg_trend > 0 else 'declining' if avg_trend < 0 else 'stable'
            }

        except Exception as e:
            raise Exception(f"Error predicting attendance: {str(e)}")

    def get_student_performance(self, student_id):
        try:
            # Get basic performance data
            student = self.data[self.data['student_id'] == student_id].iloc[0]
            
            performance = {
                'name': student['student_name'],
                'class': student['class'],
                'attendance': float(student['attendance_percentage']),
                'subjects': {}
            }

            # Calculate subject performances
            for subject in self.subjects:
                # Get individual test scores
                pat_t1 = float(student[f'pat_{subject}_t1'])
                pat_t2 = float(student[f'pat_{subject}_t2'])
                sat_t1 = float(student[f'sat_{subject}_t1'])
                sat_t2 = float(student[f'sat_{subject}_t2'])

                term1_avg = (pat_t1 + sat_t1) / 2
                term2_avg = (pat_t2 + sat_t2) / 2
                
                performance['subjects'][subject] = {
                    'pat_t1': pat_t1,
                    'sat_t1': sat_t1,
                    'pat_t2': pat_t2,
                    'sat_t2': sat_t2,
                    'term1_average': round(term1_avg, 2),
                    'term2_average': round(term2_avg, 2),
                    'average_score': round((term1_avg + term2_avg) / 2, 2),
                    'improvement': round(term2_avg - term1_avg, 2)
                }

            # Add predictions
            performance['predictions'] = {
                'final_marks': self.predict_final_marks(student_id),
                'attendance': self.predict_future_attendance(student_id)
            }
            
            return performance

        except Exception as e:
            raise Exception(f"Error getting student performance: {str(e)}")

    def get_class_insights(self, class_id):
        """Get insights for a specific class"""
        try:
            class_data = self.data[self.data['class'] == class_id]
            
            insights = {
                'total_students': len(class_data),
                'average_attendance': class_data['attendance_percentage'].mean(),
                'subject_performance': {},
                'performance_distribution': {
                    'excellent': 0,
                    'good': 0,
                    'average': 0,
                    'needs_improvement': 0
                }
            }

            # Calculate subject-wise performance
            for subject in self.subjects:
                subject_cols = [col for col in class_data.columns if subject in col.lower()]
                weak_students = []
                
                for _, student in class_data.iterrows():
                    subject_scores = [student[col] for col in subject_cols]
                    avg_score = sum(subject_scores) / len(subject_scores)
                    
                    if avg_score < 60:
                        weak_students.append({
                            'name': student['student_name'],
                            'score': round(avg_score, 2)
                        })
                
                # Calculate average score for all students in the subject
                all_scores = []
                for _, student in class_data.iterrows():
                    subject_scores = [float(student[col]) for col in subject_cols]
                    all_scores.append(sum(subject_scores) / len(subject_scores))
                
                avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
                
                insights['subject_performance'][subject] = {
                    'average_score': round(float(avg_score), 2),
                    'weak_students': weak_students
                }

            # Calculate performance distribution
            for _, student in class_data.iterrows():
                avg_scores = []
                for subject in self.subjects:
                    subject_cols = [col for col in student.index if subject in col.lower()]
                    subject_avg = student[subject_cols].mean()
                    avg_scores.append(subject_avg)
                
                overall_avg = np.mean(avg_scores)
                
                if overall_avg >= 85:
                    insights['performance_distribution']['excellent'] += 1
                elif overall_avg >= 70:
                    insights['performance_distribution']['good'] += 1
                elif overall_avg >= 60:
                    insights['performance_distribution']['average'] += 1
                else:
                    insights['performance_distribution']['needs_improvement'] += 1

            return insights

        except Exception as e:
            raise Exception(f"Error getting class insights: {str(e)}")

    def identify_weak_subjects(self, student_id):
        """Identify weak and strong subjects for a student"""
        try:
            performance = self.get_student_performance(student_id)
            weak_subjects = []
            strong_subjects = []

            for subject, data in performance['subjects'].items():
                if data['average_score'] < 60:
                    weak_subjects.append({
                        'subject': subject,
                        'score': round(data['average_score'], 2),
                        'improvement': round(data['improvement'], 2)
                    })
                elif data['average_score'] >= 85:
                    strong_subjects.append({
                        'subject': subject,
                        'score': round(data['average_score'], 2),
                        'improvement': round(data['improvement'], 2)
                    })

            return {
                'weak_subjects': sorted(weak_subjects, key=lambda x: x['score']),
                'strong_subjects': sorted(strong_subjects, key=lambda x: x['score'], reverse=True)
            }

        except Exception as e:
            raise Exception(f"Error identifying weak subjects: {str(e)}")

    def get_recommendations(self, student_id):
        """Generate personalized recommendations for a student"""
        try:
            analysis = self.identify_weak_subjects(student_id)
            performance = self.get_student_performance(student_id)
            predictions = performance['predictions']
            
            # Get ML-based recommendations
            ml_recommendations = self.predictor.get_recommendations(predictions['final_marks'])
            
            suggestions = []
            
            # Add ML-based recommendations
            suggestions.extend(ml_recommendations)

            # Add attendance-related recommendations
            attendance_pred = predictions['attendance']
            if attendance_pred['risk_level'] == 'high':
                suggestions.append("Attendance requires immediate attention. Regular attendance is crucial for improvement.")
            elif attendance_pred['risk_level'] == 'medium':
                suggestions.append("Consider improving attendance to maintain academic performance.")

            return suggestions

        except Exception as e:
            raise Exception(f"Error generating recommendations: {str(e)}")
