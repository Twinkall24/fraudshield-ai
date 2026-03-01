export interface User {
  id: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  created_at: Date;
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
  timestamp: Date;
  fraud_score: number;
  is_fraud: boolean;
  fraud_type?: string;
  model_version: string;
  status: 'pending' | 'approved' | 'declined' | 'flagged';
  created_at: Date;
}

export interface Alert {
  id: string;
  transaction_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  fraud_indicators: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assigned_to?: string;
  assigned_at?: Date;
  resolved_at?: Date;
  resolution_notes?: string;
  created_at: Date;
}

export interface FraudPrediction {
  fraud_score: number;
  is_fraud: boolean;
  fraud_type?: string;
  confidence: number;
  risk_factors: {
    name: string;
    value: number;
    contribution: number;
  }[];
  model_version: string;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}