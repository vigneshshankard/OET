import { 
  AccessToken, 
  RoomServiceClient, 
  Room
} from 'livekit-server-sdk';
import { environment } from '../config/environment';
import logger from '../utils/logger';
import { LiveKitRoom, LiveKitParticipant } from '../types/session';

export class LiveKitService {
  private roomService: RoomServiceClient;

  constructor() {
    this.roomService = new RoomServiceClient(
      environment.LIVEKIT_HOST,
      environment.LIVEKIT_API_KEY,
      environment.LIVEKIT_API_SECRET
    );

    logger.info('LiveKit service initialized', {
      host: environment.LIVEKIT_HOST
    });
  }

  // Token Management
  generateAccessToken(
    identity: string,
    roomName: string,
    metadata?: Record<string, any>
  ): any {
    try {
      const tokenOptions: any = { identity };
      
      if (metadata) {
        tokenOptions.metadata = JSON.stringify(metadata);
      }

      const token = new AccessToken(
        environment.LIVEKIT_API_KEY,
        environment.LIVEKIT_API_SECRET,
        tokenOptions
      );

      // Grant permissions for audio communication
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        canUpdateOwnMetadata: true
      });

      const accessToken = token.toJwt();

      logger.info('Access token generated', {
        identity,
        roomName
      });

      return accessToken;
    } catch (error) {
      logger.error('Failed to generate access token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        identity,
        roomName
      });
      throw error;
    }
  }

  // Room Management
  async createRoom(
    roomName: string,
    options?: {
      maxParticipants?: number;
      metadata?: Record<string, any>;
      timeout?: number;
    }
  ): Promise<Room> {
    try {
      const roomOptions: any = {
        name: roomName,
        maxParticipants: options?.maxParticipants || 10,
        emptyTimeout: options?.timeout || 300 // 5 minutes
      };

      if (options?.metadata) {
        roomOptions.metadata = JSON.stringify(options.metadata);
      }

      const room = await this.roomService.createRoom(roomOptions);

      logger.info('LiveKit room created', {
        roomName,
        sid: room.sid
      });

      return room;
    } catch (error) {
      // If room already exists, try to get it
      if (error instanceof Error && error.message.includes('already exists')) {
        logger.info('Room already exists, retrieving existing room', { roomName });
        const existingRoom = await this.getRoom(roomName);
        if (existingRoom) {
          return existingRoom;
        }
      }

      logger.error('Failed to create LiveKit room', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roomName
      });
      throw error;
    }
  }

  async getRoom(roomName: string): Promise<Room | null> {
    try {
      const rooms = await this.roomService.listRooms([roomName]);
      
      if (rooms.length === 0) {
        return null;
      }

      logger.info('LiveKit room retrieved', {
        roomName,
        sid: rooms[0].sid
      });

      return rooms[0];
    } catch (error) {
      logger.error('Failed to get LiveKit room', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roomName
      });
      throw error;
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);

      logger.info('LiveKit room deleted', { roomName });
    } catch (error) {
      logger.error('Failed to delete LiveKit room', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roomName
      });
      throw error;
    }
  }

  async listRooms(): Promise<Room[]> {
    try {
      const rooms = await this.roomService.listRooms();

      logger.info('Listed LiveKit rooms', { count: rooms.length });
      return rooms;
    } catch (error) {
      logger.error('Failed to list LiveKit rooms', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Participant Management
  async getParticipants(roomName: string): Promise<any[]> {
    try {
      const participants = await this.roomService.listParticipants(roomName);

      logger.info('Retrieved room participants', {
        roomName,
        count: participants.length
      });

      return participants;
    } catch (error) {
      logger.error('Failed to get room participants', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roomName
      });
      throw error;
    }
  }

  async getParticipant(roomName: string, identity: string): Promise<any | null> {
    try {
      const participant = await this.roomService.getParticipant(roomName, identity);
      return participant;
    } catch (error) {
      // Return null if participant not found
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }

      logger.error('Failed to get participant', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roomName,
        identity
      });
      throw error;
    }
  }

  async removeParticipant(roomName: string, identity: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(roomName, identity);

      logger.info('Participant removed from room', {
        roomName,
        identity
      });
    } catch (error) {
      logger.error('Failed to remove participant', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roomName,
        identity
      });
      throw error;
    }
  }

  async muteParticipant(
    roomName: string, 
    identity: string, 
    muted: boolean
  ): Promise<void> {
    try {
      await this.roomService.mutePublishedTrack(roomName, identity, '', muted);

      logger.info('Participant mute status updated', {
        roomName,
        identity,
        muted
      });
    } catch (error) {
      logger.error('Failed to update participant mute status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roomName,
        identity,
        muted
      });
      throw error;
    }
  }

  // Room Metadata and Updates
  async updateRoomMetadata(
    roomName: string, 
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await this.roomService.updateRoomMetadata(roomName, JSON.stringify(metadata));

      logger.info('Room metadata updated', {
        roomName,
        metadata
      });
    } catch (error) {
      logger.error('Failed to update room metadata', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roomName
      });
      throw error;
    }
  }

  async updateParticipantMetadata(
    roomName: string,
    identity: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await this.roomService.updateParticipant(roomName, identity, {
        metadata: JSON.stringify(metadata)
      });

      logger.info('Participant metadata updated', {
        roomName,
        identity,
        metadata
      });
    } catch (error) {
      logger.error('Failed to update participant metadata', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roomName,
        identity
      });
      throw error;
    }
  }

  // Utility Methods
  generateRoomName(sessionId: string): string {
    return `session-${sessionId}`;
  }

  generateParticipantIdentity(userId: string, role: 'user' | 'ai' = 'user'): string {
    return `${role}-${userId}`;
  }

  async ensureRoom(
    sessionId: string,
    options?: {
      maxParticipants?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<Room> {
    const roomName = this.generateRoomName(sessionId);
    
    // Try to get existing room first
    let room = await this.getRoom(roomName);
    
    if (!room) {
      // Create new room if it doesn't exist
      room = await this.createRoom(roomName, options);
    }

    return room;
  }

  async cleanupRoom(sessionId: string): Promise<void> {
    try {
      const roomName = this.generateRoomName(sessionId);
      
      // Get participants and remove them
      const participants = await this.getParticipants(roomName);
      
      for (const participant of participants) {
        await this.removeParticipant(roomName, participant.identity);
      }

      // Delete the room
      await this.deleteRoom(roomName);

      logger.info('Room cleanup completed', { sessionId, roomName });
    } catch (error) {
      logger.error('Failed to cleanup room', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      // Don't throw error for cleanup failures
    }
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list rooms as a health check
      await this.roomService.listRooms();
      return true;
    } catch (error) {
      logger.error('LiveKit health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}