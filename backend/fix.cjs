const fs = require('fs');
const filePath = 'c:/Users/madha/Desktop/astrotalk-replica/backend/src/server.js';
let content = fs.readFileSync(filePath, 'utf8');

const marker1 = "console.log(`[Socket.IO] Auto-rejected ${rejectedRequests.length} other pending request(s) for astrologer ${reqData.astrologerId}`);\n      }\n    }";
const startIndex = content.indexOf(marker1);
if (startIndex === -1) {
  console.log("Marker 1 not found");
  process.exit(1);
}

const marker2 = "} else if (!session.astrologerId && astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/)) {";
const endIndex = content.indexOf(marker2);
if (endIndex === -1) {
  console.log("Marker 2 not found");
  process.exit(1);
}

const replacement = `
    // Notify user that their session was accepted
    io.to(userSocketId).emit('session_accepted', { roomId });
    
    // Notifications via notifyHelper
    if (reqData) {
      import('./utils/notifyHelper.js').then(({ notify }) => {
        // Notify user
        notify({ 
          userId: reqData.userId, 
          role: 'user', 
          title: 'Session Started', 
          message: 'Your astrologer has accepted the session.', 
          type: 'success', 
          link: reqData.type === 'chat' ? '/user/chats' : '/user/video-room' 
        });
        // Notify astrologer
        if (reqData.astrologerId) {
          notify({ 
            userId: reqData.astrologerId, 
            role: 'astrologer', 
            title: 'Session Started', 
            message: 'You accepted a session.', 
            type: 'info', 
            link: '/astrologer/history' 
          });
        }
      }).catch(err => console.error('Failed to send session accepted notify:', err));
    }

    // Notify astrologer's own socket too (confirmation)
    socket.emit('session_accept_confirmed', { roomId });
    console.log('[Socket.IO] Session accepted. Room: ' + roomId);
  });

  // ── Astrologer rejects session
  socket.on('reject_session', ({ roomId, userSocketId, reason }) => {
    if (roomId && pendingRequests.has(roomId)) {
      const reqData = pendingRequests.get(roomId);
      if (reqData.timeoutId) clearTimeout(reqData.timeoutId);
      pendingRequests.delete(roomId);
    }
    io.to(userSocketId).emit('session_rejected', { reason: reason || 'Astrologer is busy right now.' });
    console.log('[Socket.IO] Astrologer rejected session. Reason: ' + reason);
  });

  // ── Join a call room for audio/video (no DB session creation)
  socket.on('join_call_room', ({ roomId }) => {
    socket.join(roomId);
    socketRoomMap.set(socket.id, { roomId, type: 'audio_call' });
    console.log('[Socket.IO] Socket ' + socket.id + ' joined call room ' + roomId);
  });

  // ── Join a chat room
  socket.on('join_room', async ({ roomId, userId, astrologerId, isBot, sessionType }) => {
    try {
      socket.join(roomId);
      socketRoomMap.set(socket.id, { roomId, type: sessionType || 'chat_session', astrologerId });

      // ── Cancel any pending disconnect grace timer for this room.
      if (disconnectGraceTimers.has(roomId)) {
        clearTimeout(disconnectGraceTimers.get(roomId));
        disconnectGraceTimers.delete(roomId);
        console.log('[Socket.IO] Grace timer cancelled for room ' + roomId + ' — user reconnected');
      }

      socket.to(roomId).emit('user_joined', { userId, message: 'A user has joined the session' });
      console.log('[Socket.IO] ' + userId + ' joined room ' + roomId + ' (Type: ' + (sessionType || 'chat') + ')');

      const ChatSession = (await import('./models/chatSession.model.js')).default;
      let session = await ChatSession.findOne({ roomId });
      let isNewSession = false;

      // If astrologerId is missing (e.g. from VideoRoom notification link), fallback to CallSession
      if ((!astrologerId || !astrologerId.match(/^[0-9a-fA-F]{24}$/)) && 
          (sessionType === 'audio_call' || sessionType === 'video_call')) {
        const { CallSession } = await import('./models/callSession.model.js');
        const existingCall = await CallSession.findOne({ channelName: roomId });
        if (existingCall && existingCall.astrologerId) {
          astrologerId = existingCall.astrologerId.toString();
        }
      }

      if (!session) {
        let astroName = 'Astrologer';
        if (astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/)) {
          const Astrologer = (await import('./models/astrologer.model.js')).default;
          const astroDoc = await Astrologer.findById(astrologerId);
          if (astroDoc && astroDoc.name) astroName = astroDoc.name;
        }

        const welcomeMessage = {
          sender: 'bot',
          text: 'Namaste, welcome! I am ' + astroName + '. Please share your name, date of birth, time of birth, and place of birth, along with your question. I am analyzing your chart now.',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        };

        session = await ChatSession.create({
          roomId,
          userId,
          astrologerId: astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/) ? astrologerId : undefined,
          isBotSession: !!isBot,
          status: 'ongoing',
          type: sessionType || 'chat',
          messages: [welcomeMessage],
        });
        isNewSession = true;
        console.log('[Socket.IO] Created ChatSession in DB with welcome message: ' + session._id);
      `;

content = content.substring(0, startIndex + marker1.length) + replacement + content.substring(endIndex);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Done");
