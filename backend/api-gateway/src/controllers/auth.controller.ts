import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, role = 'viewer', full_name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user already exists
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Insert user
      const result = await query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, created_at`,
        [email, password_hash, role]
      );

      const user = result.rows[0];

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, created_at: user.created_at },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRY || '24h' } as any
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const result = await query(
        `SELECT id, email, password_hash, role, created_at
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // No is_active column in schema; assume active by default

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      // Schema does not include last_login; skip updating it

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, created_at: user.created_at },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRY || '24h' } as any
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  async me(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const result = await query(
        `SELECT id, email, role, created_at
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
}