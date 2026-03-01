from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    PURCHASE = "purchase"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"
    REFUND = "refund"


class CardType(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"
    PREPAID = "prepaid"


class TransactionInput(BaseModel):
    """Input schema for transaction prediction"""
    transaction_id: Optional[str] = None
    user_id: Optional[str] = None
    merchant_id: Optional[str] = None
    merchant_name: Optional[str] = None
    merchant_category: Optional[str] = None
    amount: float = Field(gt=0, description="Transaction amount must be positive")
    currency: str = Field(default="USD", max_length=3)
    card_number_last4: Optional[str] = Field(default="", max_length=4)
    card_type: Optional[CardType] = None
    transaction_type: Optional[TransactionType] = None
    ip_address: Optional[str] = None
    device_id: Optional[str] = None
    location_lat: float = Field(ge=-90, le=90)
    location_lng: float = Field(ge=-180, le=180)
    location_country: Optional[str] = None
    location_city: Optional[str] = None
    timestamp: Optional[datetime] = None

    @validator('timestamp', pre=True, always=True)
    def set_timestamp(cls, v):
        return v or datetime.now()

    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "txn_1234567890",
                "user_id": "user_abc123",
                "merchant_id": "merch_xyz789",
                "merchant_name": "Amazon",
                "merchant_category": "retail",
                "amount": 299.99,
                "currency": "USD",
                "card_number_last4": "1234",
                "card_type": "credit",
                "transaction_type": "purchase",
                "ip_address": "192.168.1.1",
                "device_id": "device_mobile_001",
                "location_lat": 37.7749,
                "location_lng": -122.4194,
                "location_country": "USA",
                "location_city": "San Francisco"
            }
        }


class RiskFactor(BaseModel):
    """Individual risk factor contributing to fraud score"""
    name: str
    value: float
    contribution: float  # Contribution to final score (0-1)
    description: Optional[str] = None


class FraudPrediction(BaseModel):
    """Output schema for fraud prediction"""
    fraud_score: float = Field(ge=0, le=1, description="Probability of fraud (0-1)")
    is_fraud: bool
    fraud_type: Optional[str] = None
    confidence: float = Field(ge=0, le=1)
    risk_factors: List[RiskFactor]
    model_version: str
    prediction_time_ms: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "fraud_score": 0.87,
                "is_fraud": True,
                "fraud_type": "suspicious_location",
                "confidence": 0.92,
                "risk_factors": [
                    {
                        "name": "unusual_location",
                        "value": 1.0,
                        "contribution": 0.35,
                        "description": "Transaction from unusual location"
                    }
                ],
                "model_version": "v1.0.0",
                "prediction_time_ms": 45.2
            }
        }


class ModelMetrics(BaseModel):
    """Model performance metrics"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    false_positive_rate: float
    false_negative_rate: float
    timestamp: datetime


class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    model_version: str
    uptime_seconds: float
    predictions_count: int
    avg_prediction_time_ms: float