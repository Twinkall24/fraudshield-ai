import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import redis
import json
from geopy.distance import geodesic


class FeatureEngineer:
    """
    Feature engineering for fraud detection.
    Extracts behavioral and contextual features from transactions.
    """
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client
        self.feature_names = [
            # Amount features
            'amount',
            'amount_log',
            'amount_normalized',
            
            # Time features
            'hour_of_day',
            'day_of_week',
            'is_weekend',
            'is_night',
            
            # Location features
            'location_lat',
            'location_lng',
            
            # Velocity features
            'distance_from_last',
            'time_since_last_transaction',
            'velocity_1h',
            'velocity_24h',
            
            # User behavior features
            'avg_transaction_amount',
            'amount_deviation_from_avg',
            'transaction_count_1h',
            'transaction_count_24h',
            'unique_merchants_24h',
            
            # Merchant features
            'merchant_risk_score',
            'merchant_fraud_rate',
            
            # Card features
            'card_type_credit',
            'card_type_debit',
            
            # Transaction type features
            'txn_type_purchase',
            'txn_type_withdrawal',
            'txn_type_transfer',
            
            # Risk indicators
            'is_high_amount',
            'is_unusual_location',
            'is_rapid_transaction',
        ]
    
    def extract_features(self, transaction: Dict[str, Any]) -> np.ndarray:
        """
        Extract all features from a transaction.
        
        Args:
            transaction: Transaction data dictionary
            
        Returns:
            Feature vector as numpy array
        """
        features = {}
        
        # Amount features (amount is required by schema but accessed defensively)
        amount = float(transaction.get('amount', 0.0))
        features['amount'] = amount
        features['amount_log'] = np.log1p(amount)
        features['amount_normalized'] = self._normalize_amount(amount)
        
        # Time features
        timestamp = transaction.get('timestamp', datetime.now())
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        features['hour_of_day'] = timestamp.hour
        features['day_of_week'] = timestamp.weekday()
        features['is_weekend'] = 1 if timestamp.weekday() >= 5 else 0
        features['is_night'] = 1 if timestamp.hour >= 22 or timestamp.hour <= 6 else 0
        
        # Location features
        features['location_lat'] = float(transaction.get('location_lat', 0.0))
        features['location_lng'] = float(transaction.get('location_lng', 0.0))
        
        # Get historical features from Redis
        user_id = transaction.get('user_id', '')
        historical_features = self._get_historical_features(
            user_id,
            timestamp,
            (features['location_lat'], features['location_lng'])
        )
        features.update(historical_features)
        
        # Merchant features
        merchant_features = self._get_merchant_features(transaction.get('merchant_id', ''))
        features.update(merchant_features)
        
        # Card type (one-hot encoding)
        card_type = (transaction.get('card_type') or '').lower()
        features['card_type_credit'] = 1 if card_type == 'credit' else 0
        features['card_type_debit'] = 1 if card_type == 'debit' else 0
        
        # Transaction type (one-hot encoding)
        txn_type = (transaction.get('transaction_type') or '').lower()
        features['txn_type_purchase'] = 1 if txn_type == 'purchase' else 0
        features['txn_type_withdrawal'] = 1 if txn_type == 'withdrawal' else 0
        features['txn_type_transfer'] = 1 if txn_type == 'transfer' else 0
        
        # Risk indicators
        features['is_high_amount'] = 1 if amount > 1000 else 0
        features['is_unusual_location'] = features.get('distance_from_last', 0) > 100
        features['is_rapid_transaction'] = features.get('time_since_last_transaction', 999) < 60
        
        # Convert to numpy array in correct order
        feature_vector = np.array([features[name] for name in self.feature_names])
        
        # Update Redis cache with current transaction
        self._update_user_cache(user_id, transaction, timestamp)
        
        return feature_vector
    
    def _normalize_amount(self, amount: float) -> float:
        """Normalize amount using log scaling"""
        # Using percentiles: 50th = ~$50, 95th = ~$500
        return np.clip(np.log1p(amount) / np.log1p(500), 0, 1)
    
    def _get_historical_features(
        self, 
        user_id: str, 
        current_time: datetime,
        current_location: tuple
    ) -> Dict[str, float]:
        """
        Get historical behavior features from Redis cache.
        """
        features = {
            'distance_from_last': 0.0,
            'time_since_last_transaction': 9999.0,
            'velocity_1h': 0.0,
            'velocity_24h': 0.0,
            'avg_transaction_amount': 100.0,
            'amount_deviation_from_avg': 0.0,
            'transaction_count_1h': 0.0,
            'transaction_count_24h': 0.0,
            'unique_merchants_24h': 0.0,
        }
        
        if not self.redis_client:
            return features
        
        try:
            # Get user profile from cache
            profile_key = f"user_profile:{user_id}"
            profile_data = self.redis_client.get(profile_key)
            
            if profile_data:
                profile = json.loads(profile_data)
                
                # Calculate distance from last transaction
                last_location = profile.get('last_location')
                if last_location:
                    last_lat, last_lng = last_location
                    distance = geodesic(
                        (last_lat, last_lng),
                        current_location
                    ).kilometers
                    features['distance_from_last'] = distance
                
                # Calculate time since last transaction
                last_time = profile.get('last_transaction_time')
                if last_time:
                    last_dt = datetime.fromisoformat(last_time)
                    time_diff = (current_time - last_dt).total_seconds()
                    features['time_since_last_transaction'] = time_diff
                
                # Get transaction counts
                features['velocity_1h'] = profile.get('count_1h', 0)
                features['velocity_24h'] = profile.get('count_24h', 0)
                
                # Get average amount
                avg_amount = profile.get('avg_amount', 100.0)
                features['avg_transaction_amount'] = avg_amount
                
                # Transaction counts
                features['transaction_count_1h'] = profile.get('count_1h', 0)
                features['transaction_count_24h'] = profile.get('count_24h', 0)
                features['unique_merchants_24h'] = profile.get('unique_merchants_24h', 0)
        
        except Exception as e:
            print(f"Error getting historical features: {e}")
        
        return features
    
    def _get_merchant_features(self, merchant_id: str) -> Dict[str, float]:
        """Get merchant risk features from cache"""
        features = {
            'merchant_risk_score': 0.5,
            'merchant_fraud_rate': 0.05,
        }
        
        if not self.redis_client:
            return features
        
        try:
            merchant_key = f"merchant:{merchant_id}"
            merchant_data = self.redis_client.get(merchant_key)
            
            if merchant_data:
                merchant = json.loads(merchant_data)
                features['merchant_risk_score'] = merchant.get('risk_score', 0.5)
                features['merchant_fraud_rate'] = merchant.get('fraud_rate', 0.05)
        
        except Exception as e:
            print(f"Error getting merchant features: {e}")
        
        return features
    
    def _update_user_cache(
        self, 
        user_id: str, 
        transaction: Dict[str, Any],
        timestamp: datetime
    ):
        """Update user profile cache with current transaction"""
        if not self.redis_client:
            return
        
        try:
            profile_key = f"user_profile:{user_id}"
            
            # Get existing profile
            profile_data = self.redis_client.get(profile_key)
            if profile_data:
                profile = json.loads(profile_data)
            else:
                profile = {
                    'transactions': [],
                    'merchants': set(),
                    'total_amount': 0.0,
                    'count': 0,
                }
            
            # Update profile
            profile['last_location'] = [
                float(transaction.get('location_lat', 0.0)),
                float(transaction.get('location_lng', 0.0))
            ]
            profile['last_transaction_time'] = timestamp.isoformat()
            
            # Add to transaction history (keep last 100)
            txn_record = {
                'amount': float(transaction.get('amount', 0.0)),
                'merchant_id': transaction.get('merchant_id', ''),
                'timestamp': timestamp.isoformat(),
            }
            
            if 'transactions' not in profile:
                profile['transactions'] = []
            
            profile['transactions'].append(txn_record)
            profile['transactions'] = profile['transactions'][-100:]  # Keep last 100
            
            # Calculate rolling statistics
            now = timestamp
            one_hour_ago = now - timedelta(hours=1)
            one_day_ago = now - timedelta(days=1)
            
            recent_txns = [
                t for t in profile['transactions']
                if datetime.fromisoformat(t['timestamp']) >= one_day_ago
            ]
            
            profile['count_1h'] = len([
                t for t in recent_txns
                if datetime.fromisoformat(t['timestamp']) >= one_hour_ago
            ])
            profile['count_24h'] = len(recent_txns)
            
            merchants_24h = set(t['merchant_id'] for t in recent_txns)
            profile['unique_merchants_24h'] = len(merchants_24h)
            
            amounts = [t['amount'] for t in recent_txns]
            profile['avg_amount'] = np.mean(amounts) if amounts else 100.0
            
            # Save to Redis (expire after 7 days)
            self.redis_client.setex(
                profile_key,
                7 * 24 * 60 * 60,  # 7 days
                json.dumps(profile, default=str)
            )
        
        except Exception as e:
            print(f"Error updating user cache: {e}")
    
    def get_feature_names(self) -> list:
        """Return list of feature names"""
        return self.feature_names