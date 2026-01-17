import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

interface SocketClientConfig {
  url?: string;
  autoConnect?: boolean;
}

class SocketClient {
  private socket: Socket | null = null;
  private url: string;

  constructor(config: SocketClientConfig = {}) {
    this.url = "http://localhost:3001";
    //  || config.url || process.env.NEXT_PUBLIC_API_URL;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = Cookies.get("token");

        if (!token) {
          reject(new Error("No authentication token available"));
          return;
        }
        this.socket = io(this.url, {
          auth: {
            token,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ["websocket", "polling"],
          withCredentials: true,
        });

        this.socket.on("connected", () => {
          console.log("Socket connected");
          resolve();
        });

        this.socket.on("error", (error) => {
          console.error("Socket error:", error);
          reject(error);
        });

        this.socket.on("connect_error", (error) => {
          console.error("Connection error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Emit event
   */
  emit(event: string, data?: any): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit(event, data);
  }

  /**
   * Listen to event
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.on(event, callback);
  }

  /**
   * Listen to event once
   */
  once(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.once(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.off(event, callback);
  }
}

// Export singleton instance
export const socketClient = new SocketClient();
