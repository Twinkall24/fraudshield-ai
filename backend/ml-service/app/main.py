from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import redis
import time
from typing import Dict, Any
import os
from dotenv import load_dotenv

from app.models.schemas import (
    TransactionInput,
    FraudPrediction,
    ModelMetrics,
    HealthCheck
)
from app.prediction.predictor import FraudPredictor

load_dotenv()

# Global variables
predictor: FraudPredictor = None
redis_client: redis.Redis = None
app_start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global predictor, redis_client
    
    # Startup
    print("🚀 Starting ML Service...")
    
    # Initialize Redis
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
    try:
        redis_client = redis.from_url(redis_url, decode_responses=True)
        redis_client.ping()
        print("✅ Redis connected")
    except Exception as e:
        print(f"⚠️  Redis connection failed: {e}")
        redis_client = None
    
    # Initialize predictor
    model_path = os.getenv('MODEL_PATH', './saved_models')
    model_version = os.getenv('MODEL_VERSION', 'v1.0.0')
    
    predictor = FraudPredictor(
        model_path=model_path,
        model_version=model_version,
        redis_client=redis_client
    )
    print("✅ Fraud predictor initialized")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down ML Service...")
    if redis_client:
        redis_client.close()


# Initialize FastAPI app
app = FastAPI(
    title="Fraud Detection ML Service",
    description="Real-time fraud detection using machine learning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "service": "Fraud Detection ML Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    stats = predictor.get_stats()
    uptime = time.time() - app_start_time
    
    return HealthCheck(
        status="healthy",
        model_loaded=predictor.model is not None,
        model_version=predictor.model_version,
        uptime_seconds=uptime,
        predictions_count=stats['total_predictions'],
        avg_prediction_time_ms=stats['avg_prediction_time_ms']
    )


@app.post("/predict", response_model=FraudPrediction, tags=["Prediction"])
async def predict_fraud(transaction: TransactionInput):
    """
    Predict fraud probability for a transaction.
    
    - **transaction**: Transaction details
    
    Returns fraud score, risk factors, and fraud type.
    """
    try:
        prediction = predictor.predict(transaction)
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@app.post("/predict/batch", response_model=Dict[str, FraudPrediction], tags=["Prediction"])
async def predict_batch(transactions: list[TransactionInput]):
    """
    Batch prediction for multiple transactions.
    
    - **transactions**: List of transactions
    
    Returns predictions for each transaction.
    """
    try:
        if len(transactions) > 100:
            raise HTTPException(
                status_code=400,
                detail="Batch size limited to 100 transactions"
            )
        
        predictions = {}
        for txn in transactions:
            prediction = predictor.predict(txn)
            predictions[txn.transaction_id] = prediction
        
        return predictions
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction failed: {str(e)}"
        )


@app.get("/stats", tags=["Monitoring"])
async def get_stats():
    """Get model statistics and performance metrics"""
    return predictor.get_stats()


@app.get("/features", tags=["Model Info"])
async def get_feature_names():
    """Get list of features used by the model"""
    return {
        "features": predictor.feature_names,
        "count": len(predictor.feature_names)
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('API_PORT', 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )