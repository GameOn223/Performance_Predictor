import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

class StudentPredictor:
    def __init__(self):
        self.models = {}  # One model per subject
        self.scalers = {}  # One scaler per subject
        self.subjects = ['english', 'maths', 'science', 'social', 'computer']
        self.is_trained = False

    def train(self, data_path='data/detailed_student_data.csv'):
        try:
            df = pd.read_csv(data_path)
            
            for subject in self.subjects:
                # Prepare features for each subject
                X = []
                y = []
                
                for _, row in df.iterrows():
                    # Features: Previous scores and attendance
                    features = [
                        float(row[f'pat_{subject}_t1']),
                        float(row[f'sat_{subject}_t1']),
                        float(row[f'pat_{subject}_t2']),
                        float(row[f'sat_{subject}_t2']),
                        float(row['attendance_percentage'])
                    ]
                    
                    # Target: Average of all scores (current performance)
                    target = np.mean([
                        float(row[f'pat_{subject}_t1']),
                        float(row[f'sat_{subject}_t1']),
                        float(row[f'pat_{subject}_t2']),
                        float(row[f'sat_{subject}_t2'])
                    ])
                    
                    X.append(features)
                    y.append(target)

                X = np.array(X)
                y = np.array(y)

                # Create and fit scaler
                self.scalers[subject] = StandardScaler()
                X_scaled = self.scalers[subject].fit_transform(X)

                # Create and train model
                self.models[subject] = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=5,
                    random_state=42
                )
                self.models[subject].fit(X_scaled, y)
            
            self.is_trained = True
            return True
        except Exception as e:
            print(f"Error training model: {str(e)}")
            return False

    def predict(self, student_data):
        """
        Predict performance for a student
        student_data: Dictionary with subject scores and attendance
        """
        if not self.is_trained:
            self.train()
        
        predictions = {}
        
        for subject in self.subjects:
            try:
                # Prepare features
                features = [
                    student_data[f'pat_{subject}_t1'],
                    student_data[f'sat_{subject}_t1'],
                    student_data[f'pat_{subject}_t2'],
                    student_data[f'sat_{subject}_t2'],
                    student_data['attendance_percentage']
                ]
                
                # Scale features
                X_scaled = self.scalers[subject].transform([features])
                
                # Get base prediction
                predicted_score = self.models[subject].predict(X_scaled)[0]
                
                # Get prediction confidence using tree variance
                tree_predictions = []
                for tree in self.models[subject].estimators_:
                    tree_predictions.append(tree.predict(X_scaled)[0])
                
                variance = np.std(tree_predictions)
                confidence = min(95, max(60, 100 - (variance * 5)))
                
                # Get feature importances
                importances = self.models[subject].feature_importances_
                factors = ['PAT T1', 'SAT T1', 'PAT T2', 'SAT T2', 'Attendance']
                contributing_factors = [
                    {'factor': f, 'importance': round(i * 100, 1)}
                    for f, i in zip(factors, importances)
                ]
                
                # Calculate trend
                recent_avg = np.mean([features[2], features[3]])  # T2 scores
                previous_avg = np.mean([features[0], features[1]])  # T1 scores
                trend = 'improving' if recent_avg > previous_avg else 'declining' if recent_avg < previous_avg else 'stable'
                
                predictions[subject] = {
                    'predicted_score': round(predicted_score, 1),
                    'confidence': round(confidence, 1),
                    'trend': trend,
                    'contributing_factors': contributing_factors
                }
                
            except Exception as e:
                print(f"Error predicting for {subject}: {str(e)}")
                predictions[subject] = None
        
        return predictions

    def get_recommendations(self, performance_data):
        """Generate personalized recommendations based on ML predictions"""
        recommendations = []
        
        for subject, data in performance_data.items():
            if data is None:
                continue
                
            score = data['predicted_score']
            trend = data['trend']
            
            # Get most important factors
            important_factors = sorted(
                data['contributing_factors'], 
                key=lambda x: x['importance'], 
                reverse=True
            )[:2]
            
            if score >= 85:
                if trend == 'improving':
                    recommendations.append(f"Excellent work in {subject.title()}! Keep focusing on {important_factors[0]['factor']}")
                else:
                    recommendations.append(f"Strong performance in {subject.title()}. To maintain, focus on {important_factors[0]['factor']}")
            elif score >= 70:
                if trend == 'improving':
                    recommendations.append(f"Good progress in {subject.title()}. Strengthen {important_factors[0]['factor']} to improve further")
                else:
                    recommendations.append(f"In {subject.title()}, focus on {important_factors[0]['factor']} and {important_factors[1]['factor']}")
            else:
                factors_str = f"{important_factors[0]['factor']} and {important_factors[1]['factor']}"
                recommendations.append(f"Priority attention needed in {subject.title()}. Focus on improving {factors_str}")
        
        return recommendations
