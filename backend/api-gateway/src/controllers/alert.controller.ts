import { Request, Response } from 'express';
import { query } from '../config/database';
import { redisPub } from '../config/redis';
import { AuthRequest } from '../middleware/auth';

export class AlertController {
  async getAlerts(req: Request, res: Response) {
    try {
      const { status, severity, page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let queryText = `
        SELECT a.*, t.transaction_id, t.amount, t.merchant_name, t.fraud_score
        FROM alerts a
        JOIN transactions t ON a.transaction_id = t.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        queryText += ` AND a.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (severity) {
        queryText += ` AND a.severity = $${paramIndex}`;
        params.push(severity);
        paramIndex++;
      }

      queryText += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(Number(limit), offset);

      const result = await query(queryText, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM alerts WHERE 1=1';
      const countParams: any[] = [];
      let countIndex = 1;

      if (status) {
        countQuery += ` AND status = $${countIndex}`;
        countParams.push(status);
        countIndex++;
      }

      if (severity) {
        countQuery += ` AND severity = $${countIndex}`;
        countParams.push(severity);
        countIndex++;
      }

      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        alerts: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }

  async updateAlert(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, resolution_notes } = req.body;
      const userId = req.user!.id;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        updates.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;

        if (status === 'investigating') {
          updates.push(`assigned_to = $${paramIndex}`);
          params.push(userId);
          paramIndex++;
          updates.push(`assigned_at = CURRENT_TIMESTAMP`);
        } else if (status === 'resolved' || status === 'false_positive') {
          updates.push(`resolved_at = CURRENT_TIMESTAMP`);
        }
      }

      if (resolution_notes) {
        updates.push(`resolution_notes = $${paramIndex}`);
        params.push(resolution_notes);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      params.push(id);
      const queryText = `
        UPDATE alerts 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await query(queryText, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      // Publish update
      await redisPub.publish(
        'alerts',
        JSON.stringify({
          type: 'alert_updated',
          data: result.rows[0],
        })
      );

      res.json({ alert: result.rows[0] });
    } catch (error) {
      console.error('Update alert error:', error);
      res.status(500).json({ error: 'Failed to update alert' });
    }
  }

  async getAlertStats(req: Request, res: Response) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_alerts,
          COUNT(*) FILTER (WHERE status = 'open') as open_count,
          COUNT(*) FILTER (WHERE status = 'investigating') as investigating_count,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
          COUNT(*) FILTER (WHERE severity = 'high') as high_count,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h_count
        FROM alerts
      `;

      const result = await query(statsQuery);
      const stats = result.rows[0];

      res.json({
        total_alerts: parseInt(stats.total_alerts),
        open_count: parseInt(stats.open_count),
        investigating_count: parseInt(stats.investigating_count),
        resolved_count: parseInt(stats.resolved_count),
        critical_count: parseInt(stats.critical_count),
        high_count: parseInt(stats.high_count),
        last_24h_count: parseInt(stats.last_24h_count),
      });
    } catch (error) {
      console.error('Get alert stats error:', error);
      res.status(500).json({ error: 'Failed to fetch alert stats' });
    }
  }
}