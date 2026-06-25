import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      required: false,
    },
    isBotSession: {
      type: Boolean,
      default: false,
    },
    botSessionId: {
      type: String,
    },
    botStartedAt: {
      type: Date,
    },
    isWaitingForAstrologer: {
      type: Boolean,
      default: false,
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['user', 'astrologer', 'system', 'bot'],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        time: {
          type: String, // format: HH:MM AM/PM
        },
      },
    ],
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'missed'],
      default: 'ongoing',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    amountDeducted: {
      type: Number,
      default: 0,
    },
    isFreeChat: {
      type: Boolean,
      default: false,
    },
    deletedByUser: {
      type: Boolean,
      default: false,
    },
    deletedByAstrologer: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['chat', 'audio', 'video', 'audio_call', 'video_call'],
      default: 'chat',
    },
  },
  {
    timestamps: true,
  }
);

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
