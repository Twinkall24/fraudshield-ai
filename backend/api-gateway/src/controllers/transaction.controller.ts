import { Request, Response } from 'express';
import axios from 'axios';
import { query } from '../config/database';
import { redisPub } from '../config/redis';
import { AuthRequest } from '../middleware/auth';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export class TransactionController {
    async create(req: AuthRequest, res: Response) {
        try {
            const {
                transaction_id,
                user_id,
                merchant_id,
                merchant_name,
                merchant_category,
                amount,
                currency = 'USD',
                card_number_last4,
                card_type,
                transaction_type,
                ip_address,
                device_id,
                location_lat,
                location_lng,
                location_country,
                location_city,
            } = req.body;

            if (!amount || !merchant_name) {
                return res.status(400).json({ error: 'Amount and merchant_name are required' });
            }

            // Call ML service for fraud prediction
            let fraudPrediction = {
                fraud_score: 0,
                is_fraud: false,
                fraud_type: null as string | null,
                model_version: 'v1.0.0',
            };

            try {
                // send full transaction details to ML service to satisfy its schema
                const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
                    transaction_id: transaction_id || `txn_${Date.now()}`,
                    user_id: user_id || '',
                    merchant_id: merchant_id || '',
                    merchant_name: merchant_name || '',
                    merchant_category,
                    amount,
                    currency,
                    card_number_last4: card_number_last4 || '',
                    card_type,
                    transaction_type,
                    ip_address,
                    device_id,
                    location_lat,
                    location_lng,
                    location_country,
                    location_city: location_city || '',
                    timestamp: new Date().toISOString(),
                }, { timeout: 5000 });

                fraudPrediction = mlResponse.data;
            } catch (mlError) {
                console.warn('ML service unavailable, using default prediction:', mlError);
            }

            // Determine status based on fraud score
            let status = 'approved';
            if (fraudPrediction.fraud_score > 0.8) {
                status = 'declined';
            } else if (fraudPrediction.fraud_score > 0.5) {
                status = 'flagged';
            }

            // Insert transaction
            const result = await query(
                `INSERT INTO transactions (
          transaction_id, user_id, merchant_id, merchant_name, merchant_category,
          amount, currency, card_number_last4, card_type, transaction_type,
          ip_address, device_id, location_lat, location_lng, location_country,
          location_city, fraud_score, is_fraud, fraud_type, model_version, status
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21
        ) RETURNING *`,
                [
                    transaction_id || `txn_${Date.now()}`,
                    user_id,
                    merchant_id,
                    merchant_name,
                    merchant_category,
                    amount,
                    currency,
                    card_number_last4,
                    card_type,
                    transaction_type,
                    ip_address,
                    device_id,
                    location_lat,
                    location_lng,
                    location_country,
                    location_city,
                    fraudPrediction.fraud_score,
                    fraudPrediction.is_fraud,
                    fraudPrediction.fraud_type,
                    fraudPrediction.model_version,
                    status,
                ]
            );

            const transaction = result.rows[0];

            // If fraud detected, create an alert
            if (fraudPrediction.is_fraud || fraudPrediction.fraud_score > 0.5) {
                const severity =
                    fraudPrediction.fraud_score > 0.9
                        ? 'critical'
                        : fraudPrediction.fraud_score > 0.75
                            ? 'high'
                            : fraudPrediction.fraud_score > 0.5
                                ? 'medium'
                                : 'low';

                await query(
                    `INSERT INTO alerts (
            transaction_id, severity, title, description, fraud_indicators
          ) VALUES ($1, $2, $3, $4, $5)`,
                    [
                        transaction.id,
                        severity,
                        `Fraud Alert: ${fraudPrediction.fraud_type || 'Suspicious Activity'}`,
                        `Transaction flagged with fraud score ${(fraudPrediction.fraud_score * 100).toFixed(1)}%`,
                        JSON.stringify({ fraud_score: fraudPrediction.fraud_score, fraud_type: fraudPrediction.fraud_type }),
                    ]
                );
            }

            // Publish to Redis for real-time updates
            await redisPub.publish(
                'transactions',
                JSON.stringify({
                    type: 'new_transaction',
                    data: transaction,
                })
            );

            res.status(201).json({ transaction, fraud_prediction: fraudPrediction });
        } catch (error) {
            console.error('Create transaction error:', error);
            res.status(500).json({ error: 'Failed to create transaction' });
        }
    }

    async getTransactions(req: AuthRequest, res: Response) {
        try {
            const {
                page = 1,
                limit = 50,
                status,
                is_fraud,
                min_amount,
                max_amount,
                start_date,
                end_date,
                search,
            } = req.query;

            const offset = (Number(page) - 1) * Number(limit);
            const params: any[] = [];
            let paramIndex = 1;

            let queryText = `SELECT * FROM transactions WHERE 1=1`;

            if (status) {
                queryText += ` AND status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            if (is_fraud !== undefined) {
                queryText += ` AND is_fraud = $${paramIndex}`;
                params.push(is_fraud === 'true');
                paramIndex++;
            }

            if (min_amount) {
                queryText += ` AND amount >= $${paramIndex}`;
                params.push(Number(min_amount));
                paramIndex++;
            }

            if (max_amount) {
                queryText += ` AND amount <= $${paramIndex}`;
                params.push(Number(max_amount));
                paramIndex++;
            }

            if (start_date) {
                queryText += ` AND timestamp >= $${paramIndex}`;
                params.push(start_date);
                paramIndex++;
            }

            if (end_date) {
                queryText += ` AND timestamp <= $${paramIndex}`;
                params.push(end_date);
                paramIndex++;
            }

            if (search) {
                queryText += ` AND (merchant_name ILIKE $${paramIndex} OR transaction_id ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(Number(limit), offset);

            const result = await query(queryText, params);

            // Get total count (run separate count query without LIMIT/OFFSET)
            let countQuery = `SELECT COUNT(*) FROM transactions WHERE 1=1`;
            const countParams: any[] = [];
            let countIndex = 1;

            if (status) {
                countQuery += ` AND status = $${countIndex}`;
                countParams.push(status);
                countIndex++;
            }
            if (is_fraud !== undefined) {
                countQuery += ` AND is_fraud = $${countIndex}`;
                countParams.push(is_fraud === 'true');
                countIndex++;
            }
            if (min_amount) {
                countQuery += ` AND amount >= $${countIndex}`;
                countParams.push(Number(min_amount));
                countIndex++;
            }
            if (max_amount) {
                countQuery += ` AND amount <= $${countIndex}`;
                countParams.push(Number(max_amount));
                countIndex++;
            }
            if (start_date) {
                countQuery += ` AND timestamp >= $${countIndex}`;
                countParams.push(start_date);
                countIndex++;
            }
            if (end_date) {
                countQuery += ` AND timestamp <= $${countIndex}`;
                countParams.push(end_date);
                countIndex++;
            }
            if (search) {
                countQuery += ` AND (merchant_name ILIKE $${countIndex} OR transaction_id ILIKE $${countIndex})`;
                countParams.push(`%${search}%`);
                countIndex++;
            }

            const countResult = await query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].count);

            res.json({
                transactions: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        } catch (error) {
            console.error('Get transactions error:', error);
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    }

    async getTransaction(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const result = await query(
                `SELECT t.*, 
          json_agg(a.*) FILTER (WHERE a.id IS NOT NULL) as alerts
         FROM transactions t
         LEFT JOIN alerts a ON a.transaction_id = t.id
         WHERE t.id = $1 OR t.transaction_id = $1
         GROUP BY t.id`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            res.json({ transaction: result.rows[0] });
        } catch (error) {
            console.error('Get transaction error:', error);
            res.status(500).json({ error: 'Failed to fetch transaction' });
        }
    }

    async updateStatus(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const allowedStatuses = ['pending', 'approved', 'declined', 'flagged'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ error: 'Invalid status value' });
            }

            const result = await query(
                `UPDATE transactions
                 SET status = $1, updated_at = NOW()
                 WHERE id = $2
                 RETURNING *`,
                [status, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            const transaction = result.rows[0];

            // Optionally we could publish an update event; for now we just return the updated row.
            res.json({ transaction });
        } catch (error) {
            console.error('Update transaction status error:', error);
            res.status(500).json({ error: 'Failed to update transaction status' });
        }
    }

    async getStats(req: AuthRequest, res: Response) {
        try {
            const statsQuery = `
        SELECT
          COUNT(*) as total_transactions,
          COUNT(*) FILTER (WHERE is_fraud = true) as fraud_count,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
          COUNT(*) FILTER (WHERE status = 'declined') as declined_count,
          COUNT(*) FILTER (WHERE status = 'flagged') as flagged_count,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(AVG(amount), 0) as avg_amount,
          COALESCE(AVG(fraud_score), 0) as avg_fraud_score,
          COALESCE(SUM(amount) FILTER (WHERE is_fraud = true), 0) as fraud_amount,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h_count,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours' AND is_fraud = true) as last_24h_fraud_count
        FROM transactions
      `;

            const result = await query(statsQuery);
            const stats = result.rows[0];

            // Get fraud by category
            const categoryQuery = `
        SELECT merchant_category, COUNT(*) as count, 
               COUNT(*) FILTER (WHERE is_fraud = true) as fraud_count
        FROM transactions
        WHERE merchant_category IS NOT NULL
        GROUP BY merchant_category
        ORDER BY fraud_count DESC
        LIMIT 10
      `;
            const categoryResult = await query(categoryQuery);

            // Get hourly fraud trend (last 24 hours)
            const trendQuery = `
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_fraud = true) as fraud_count
        FROM transactions
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY hour
      `;
            const trendResult = await query(trendQuery);

            res.json({
                total_transactions: parseInt(stats.total_transactions),
                fraud_count: parseInt(stats.fraud_count),
                approved_count: parseInt(stats.approved_count),
                declined_count: parseInt(stats.declined_count),
                flagged_count: parseInt(stats.flagged_count),
                total_amount: parseFloat(stats.total_amount),
                avg_fraud_score: parseFloat(stats.avg_fraud_score),
                avg_amount: parseFloat(stats.avg_amount),
                fraud_amount: parseFloat(stats.fraud_amount),
                fraud_rate:
                    stats.total_transactions > 0
                        ? (parseInt(stats.fraud_count) / parseInt(stats.total_transactions)) * 100
                        : 0,
                last_24h_count: parseInt(stats.last_24h_count),
                last_24h_fraud_count: parseInt(stats.last_24h_fraud_count),
                by_category: categoryResult.rows,
                hourly_trend: trendResult.rows,
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    }
}
