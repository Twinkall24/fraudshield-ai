import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { redisSub } from '../config/redis';

export class WebSocketService {
    private io: SocketIOServer;

    constructor(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        this.setupRedisSubscriptions();
        this.setupSocketHandlers();
        console.log('✅ WebSocket service initialized');
    }

    private setupRedisSubscriptions() {
        // Subscribe to Redis channels for real-time updates
        redisSub.subscribe('transactions', 'alerts', (err, count) => {
            if (err) {
                console.error('Redis subscription error:', err);
                return;
            }
            console.log(`✅ Subscribed to ${count} Redis channels`);
        });

        redisSub.on('message', (channel: string, message: string) => {
            try {
                const data = JSON.parse(message);
                this.io.emit(channel, data);
            } catch (error) {
                console.error('Error broadcasting Redis message:', error);
            }
        });
    }

    private setupSocketHandlers() {
        this.io.on('connection', (socket: Socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });

            socket.on('join_room', (room: string) => {
                socket.join(room);
                console.log(`Socket ${socket.id} joined room: ${room}`);
            });

            socket.on('leave_room', (room: string) => {
                socket.leave(room);
                console.log(`Socket ${socket.id} left room: ${room}`);
            });
        });
    }

    public emit(event: string, data: any) {
        this.io.emit(event, data);
    }

    public emitToRoom(room: string, event: string, data: any) {
        this.io.to(room).emit(event, data);
    }
}
