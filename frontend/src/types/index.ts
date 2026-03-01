export interface User {
  id: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  created_at: string;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  user_id: string;
  merchant_id: string;
  merchant_name: string;
  merchant_category: string;
  amount: number;
  currency: string;
  card_number_last4: string;
  card_type: string;
  transaction_type: string;
  ip_address: string;
  device_id: string;
  location_lat: number;
  location_lng: number;
  location_country: string;
  location_city: string;
  timestamp: string;
  fraud_score: number;
  is_fraud: boolean;
  fraud_type?: string;
  model_version: string;
  status: 'pending' | 'approved' | 'declined' | 'flagged';
  created_at: string;
}

export interface Alert {
  id: string;
  transaction_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  fraud_indicators: any;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assigned_to?: string;
  assigned_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface TransactionStats {
  total_transactions: number;
  fraud_count: number;
  fraud_rate: number;
  last_24h_count: number;
  avg_amount: number;
  fraud_amount: number;
  avg_fraud_score: number;
  approved_count: number;
  declined_count: number;
  flagged_count: number;
  total_amount: number;
  last_24h_fraud_count: number;
  by_category?: { merchant_category: string; count: number; fraud_count: number }[];
  hourly_trend?: { hour: string; total: number; fraud_count: number }[];
}

export interface AlertStats {
  total_alerts: number;
  open_count: number;
  investigating_count: number;
  resolved_count: number;
  critical_count: number;
  high_count: number;
  last_24h_count: number;
}

export interface FraudPrediction {
  fraud_score: number;
  is_fraud: boolean;
  fraud_type?: string;
  confidence: number;
  risk_factors: RiskFactor[];
  model_version: string;
  prediction_time_ms: number;
}

export interface RiskFactor {
  name: string;
  value: number;
  contribution: number;
  description?: string;
}