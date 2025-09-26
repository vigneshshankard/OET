const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

class LiveKitService {
  constructor({ apiKey, secretKey, url }) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.url = url;
    this.roomService = new RoomServiceClient(url, apiKey, secretKey);
  }

  /**
   * Create a participant token for joining a LiveKit room
   */
  async createParticipantToken(roomName, participantName, permissions = {}) {
    try {
      console.log(`Creating token for ${participantName} in room ${roomName}`);
      
      const at = new AccessToken(this.apiKey, this.secretKey, {
        identity: participantName,
      });

      // Set room permissions
      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: permissions.canPublish ?? true,
        canSubscribe: permissions.canSubscribe ?? true,
        canPublishData: permissions.canPublishData ?? false,
      });

      const token = await at.toJwt();
      console.log(`✅ Token created successfully for ${participantName}`);
      
      return token;
    } catch (error) {
      console.error('Error creating participant token:', error);
      throw error;
    }
  }

  /**
   * Create or get room information
   */
  async createRoom(roomName, options = {}) {
    try {
      console.log(`Creating/getting room: ${roomName}`);
      
      const roomOptions = {
        name: roomName,
        emptyTimeout: options.emptyTimeout || 300, // 5 minutes
        maxParticipants: options.maxParticipants || 10,
        ...options
      };

      const room = await this.roomService.createRoom(roomOptions);
      console.log(`✅ Room created/retrieved: ${roomName}`);
      
      return room;
    } catch (error) {
      // If room already exists, that's fine
      if (error.message.includes('already exists')) {
        console.log(`📍 Room ${roomName} already exists`);
        return await this.getRoomInfo(roomName);
      }
      console.error('Error creating room:', error);
      throw error;
    }
  }

  /**
   * Get room information
   */
  async getRoomInfo(roomName) {
    try {
      const rooms = await this.roomService.listRooms();
      const room = rooms.find(r => r.name === roomName);
      return room;
    } catch (error) {
      console.error('Error getting room info:', error);
      throw error;
    }
  }

  /**
   * List participants in a room
   */
  async listParticipants(roomName) {
    try {
      const participants = await this.roomService.listParticipants(roomName);
      return participants;
    } catch (error) {
      console.error('Error listing participants:', error);
      throw error;
    }
  }

  /**
   * Remove participant from room
   */
  async removeParticipant(roomName, participantIdentity) {
    try {
      await this.roomService.removeParticipant(roomName, participantIdentity);
      console.log(`✅ Removed participant ${participantIdentity} from ${roomName}`);
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  /**
   * Delete room
   */
  async deleteRoom(roomName) {
    try {
      await this.roomService.deleteRoom(roomName);
      console.log(`✅ Deleted room: ${roomName}`);
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }

  /**
   * Send data message to room participants
   */
  async sendDataToRoom(roomName, data, destinationIdentities = []) {
    try {
      await this.roomService.sendData(roomName, data, {
        destinationIdentities
      });
      console.log(`✅ Sent data to room ${roomName}`);
    } catch (error) {
      console.error('Error sending data:', error);
      throw error;
    }
  }
}

module.exports = LiveKitService;