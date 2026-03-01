import numpy as np
import joblib
import time
from typing import Dict, Any, List, Tuple
from pathlib import Path
import xgboost as xgb
from datetime import datetime

from app.models.schemas import FraudPrediction, RiskFactor, TransactionInput
from app.preprocessing.feature_engineer import FeatureEngineer


class FraudPredictor:
    """
    Fraud detection model predictor.
    Handles model loading, prediction, and risk factor analysis.
    """
    
    def __init__(self, model_path: str, model_version: str, redis_client=None):
        self.model_path = Path(model_path)
        self.model_version = model_version
        self.redis_client = redis_client
        
        self.model = None
        self.feature_engineer = FeatureEngineer(redis_client)
        self.feature_names = self.feature_engineer.get_feature_names()
        
        # Thresholds
        self.fraud_threshold = 0.7
        self.high_confidence_threshold = 0.85
        
        # Statistics
        self.prediction_count = 0
        self.total_prediction_time = 0.0
        
        # Load model
        self._load_model()
    
    def _load_model(self):
        """Load the trained model from disk"""
        model_file = self.model_path / f"fraud_model_{self.model_version}.pkl"
        
        if not model_file.exists():
            print(f"⚠️  Model file not found: {model_file}")
            print("📦 Creating a default model for demo purposes...")
            self._create_default_model()
            return
        
        try:
            self.model = joblib.load(model_file)
            print(f"✅ Model loaded: {model_file}")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self._create_default_model()
    
    def _create_default_model(self):
        """
        Create a simple default model for demo purposes.
        In production, this would be replaced with a trained model.
        """
        print("Creating default XGBoost model...")
        
        # Create a simple XGBoost model with random weights
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        # Generate dummy training data
        np.random.seed(42)
        n_samples = 1000
        X_dummy = np.random.randn(n_samples, len(self.feature_names))
        
        # Create fraud labels based on simple rules
        y_dummy = np.zeros(n_samples)
        # High amounts are more likely fraud
        y_dummy[X_dummy[:, 0] > 2] = 1
        # Night transactions are more likely fraud
        y_dummy[X_dummy[:, 3] > 0.8] = 1
        # Add some randomness
        y_dummy = np.random.binomial(1, 0.7, n_samples) * y_dummy
        
        self.model.fit(X_dummy, y_dummy)
        
        # Save the model
        self.model_path.mkdir(parents=True, exist_ok=True)
        model_file = self.model_path / f"fraud_model_{self.model_version}.pkl"
        joblib.dump(self.model, model_file)
        
        print(f"✅ Default model created and saved to {model_file}")
    
    def predict(self, transaction: TransactionInput) -> FraudPrediction:
        """
        Predict fraud probability for a transaction.
        
        Args:
            transaction: Transaction input data
            
        Returns:
            FraudPrediction with score and risk factors
        """
        start_time = time.time()
        
        # Extract features
        transaction_dict = transaction.model_dump()
        features = self.feature_engineer.extract_features(transaction_dict)
        features_2d = features.reshape(1, -1)
        
        # Get prediction
        fraud_prob = self.model.predict_proba(features_2d)[0][1]
        is_fraud = fraud_prob >= self.fraud_threshold
        
        # Calculate confidence
        confidence = self._calculate_confidence(fraud_prob)
        
        # Determine fraud type
        fraud_type = self._determine_fraud_type(features, fraud_prob) if is_fraud else None
        
        # Get risk factors
        risk_factors = self._analyze_risk_factors(features, fraud_prob)
        
        # Calculate prediction time
        prediction_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Update statistics
        self.prediction_count += 1
        self.total_prediction_time += prediction_time
        
        return FraudPrediction(
            fraud_score=float(fraud_prob),
            is_fraud=bool(is_fraud),
            fraud_type=fraud_type,
            confidence=float(confidence),
            risk_factors=risk_factors,
            model_version=self.model_version,
            prediction_time_ms=float(prediction_time)
        )
    
    def _calculate_confidence(self, fraud_prob: float) -> float:
        """
        Calculate prediction confidence based on how far from decision boundary.
        """
        distance_from_boundary = abs(fraud_prob - self.fraud_threshold)
        # Normalize to 0-1 scale
        confidence = min(distance_from_boundary * 2 + 0.5, 1.0)
        return confidence
    
    def _determine_fraud_type(self, features: np.ndarray, fraud_prob: float) -> str:
        """
        Determine the type of fraud based on risk factors.
        """
        feature_dict = {name: val for name, val in zip(self.feature_names, features)}
        
        # Check various fraud patterns
        if feature_dict.get('is_unusual_location', 0) > 0.5:
            return 'suspicious_location'
        elif feature_dict.get('is_rapid_transaction', 0) > 0.5:
            return 'velocity_abuse'
        elif feature_dict.get('is_high_amount', 0) > 0.5:
            return 'high_value_fraud'
        elif feature_dict.get('is_night', 0) > 0.5:
            return 'unusual_time'
        elif feature_dict.get('merchant_risk_score', 0.5) > 0.8:
            return 'risky_merchant'
        else:
            return 'general_suspicious_pattern'
    
    def _analyze_risk_factors(
        self, 
        features: np.ndarray,
        fraud_prob: float
    ) -> List[RiskFactor]:
        """
        Analyze which features contributed most to fraud prediction.
        """
        # Get feature importances from model
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
        else:
            # Fallback: use SHAP-like approximation
            importances = np.abs(features) / (np.abs(features).sum() + 1e-10)
        
        # Create risk factors for top contributing features
        feature_contributions = [
            (name, val, imp) 
            for name, val, imp in zip(self.feature_names, features, importances)
        ]
        
        # Sort by importance
        feature_contributions.sort(key=lambda x: x[2], reverse=True)
        
        # Get top 5 risk factors
        risk_factors = []
        for name, value, contribution in feature_contributions[:5]:
            risk_factors.append(RiskFactor(
                name=name,
                value=float(value),
                contribution=float(contribution),
                description=self._get_factor_description(name, value)
            ))
        
        return risk_factors
    
    def _get_factor_description(self, feature_name: str, value: float) -> str:
        """Get human-readable description of risk factor"""
        descriptions = {
            'amount': f'Transaction amount: ${value:.2f}',
            'distance_from_last': f'Distance from last transaction: {value:.0f} km',
            'time_since_last_transaction': f'Time since last: {value:.0f} seconds',
            'is_night': 'Transaction during night hours' if value > 0.5 else 'Normal hours',
            'is_high_amount': 'Unusually high amount' if value > 0.5 else 'Normal amount',
            'velocity_1h': f'{int(value)} transactions in last hour',
            'merchant_risk_score': f'Merchant risk: {value:.2f}',
        }
        return descriptions.get(feature_name, f'{feature_name}: {value:.2f}')
    
    def get_stats(self) -> Dict[str, Any]:
        """Get predictor statistics"""
        avg_time = (
            self.total_prediction_time / self.prediction_count 
            if self.prediction_count > 0 
            else 0
        )
        
        return {
            'total_predictions': self.prediction_count,
            'avg_prediction_time_ms': avg_time,
            'model_version': self.model_version,
            'fraud_threshold': self.fraud_threshold,
            'feature_count': len(self.feature_names),
        }