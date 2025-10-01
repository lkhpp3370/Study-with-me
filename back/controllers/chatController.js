const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const path = require("path");

/* ===========================
   ✅ 메시지 전송 (텍스트 / 투표)
=========================== */
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { senderId, type, content, poll } = req.body;

    const newMessage = new Message({
      chatRoomId: roomId,
      sender: senderId,
      type,
      content: type === "poll" ? null : content,
      poll: type === "poll" ? poll : null,
      readBy: [senderId],
    });

    await newMessage.save();

    // ✅ lastMessagePreview 생성
    let preview = "";
    if (type === "image") preview = "[이미지]";
    else if (type === "file") preview = "[파일]";
    else if (type === "poll") preview = "[투표]";
    else preview = content?.length > 30 ? content.slice(0, 15) + "..." : content;

    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: newMessage._id,          // ✅ ObjectId
      lastMessagePreview: preview,          // ✅ 문자열
      lastMessageAt: new Date(),
    });

    // 소켓 브로드캐스트
    const io = req.app.get("io");
    io?.to(roomId).emit("receiveMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("❌ 메시지 전송 실패:", err);
    res.status(500).json({ error: "메시지 전송 실패" });
  }
};

/* ===========================
   ✅ 단일 이미지 업로드 메시지
=========================== */
exports.sendImageMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { senderId } = req.body;

    if (!req.file) return res.status(400).json({ error: "이미지 파일이 없습니다." });

    const relativePath = path.join("uploads", "chat", path.basename(req.file.path));

    const newMessage = new Message({
      chatRoomId: roomId,
      sender: senderId,
      type: "image",
      content: relativePath,
      readBy: [senderId],
    });

    await newMessage.save();

    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: newMessage._id,
      lastMessagePreview: "[이미지]",
      lastMessageAt: new Date(),
    });

    const io = req.app.get("io");
    io?.to(roomId).emit("receiveMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("❌ 이미지 메시지 전송 실패:", err);
    res.status(500).json({ error: "이미지 메시지 전송 실패" });
  }
};

/* ===========================
   ✅ 다중 이미지 업로드 메시지 (최대 10장)
=========================== */
exports.sendMultipleImages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { senderId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "이미지 파일이 없습니다." });
    }

    const messages = [];
    for (const file of req.files) {
      const relativePath = path.join("uploads", "chat", path.basename(file.path));
      const newMessage = new Message({
        chatRoomId: roomId,
        sender: senderId,
        type: "image",
        content: relativePath,
        readBy: [senderId],
      });
      await newMessage.save();
      messages.push(newMessage);

      // 개별 emit
      const io = req.app.get("io");
      io?.to(roomId).emit("receiveMessage", newMessage);
    }

    // 마지막 메시지 갱신은 마지막 파일 기준
    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: messages[messages.length - 1]._id,
      lastMessagePreview: "[이미지 여러 장]",
      lastMessageAt: new Date(),
    });

    res.status(201).json(messages);
  } catch (err) {
    console.error("❌ 다중 이미지 전송 실패:", err);
    res.status(500).json({ error: "다중 이미지 전송 실패" });
  }
};

/* ===========================
   ✅ 파일 업로드 메시지
=========================== */
exports.sendFileMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { senderId } = req.body;

    if (!req.file) return res.status(400).json({ error: "파일이 없습니다." });

    const relativePath = path.join("uploads", "chat", path.basename(req.file.path));

    const newMessage = new Message({
      chatRoomId: roomId,
      sender: senderId,
      type: "file",
      content: relativePath,
      readBy: [senderId],
    });

    await newMessage.save();

    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: newMessage._id,
      lastMessagePreview: "[파일]",
      lastMessageAt: new Date(),
    });

    const io = req.app.get("io");
    io?.to(roomId).emit("receiveMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("❌ 파일 메시지 전송 실패:", err);
    res.status(500).json({ error: "파일 메시지 전송 실패" });
  }
};

/* ===========================
   ✅ 메시지 불러오기
=========================== */
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ chatRoomId: roomId })
      .populate("sender", "username")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error("❌ 메시지 조회 실패:", err);
    res.status(500).json({ error: "메시지 조회 실패" });
  }
};

/* ===========================
   ✅ 읽음 처리
=========================== */
exports.readMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "메시지를 찾을 수 없음" });

    // 이미 읽지 않았다면 readBy에 추가
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    // ✅ 소켓 브로드캐스트
    const io = req.app.get("io");
    io?.to(message.chatRoomId.toString()).emit("updateReadCount", {
      messageId,
      readCount: message.readBy.length,
    });

    res.status(200).json({
      message: "읽음 처리 완료",
      readCount: message.readBy.length,
    });
  } catch (err) {
    console.error("❌ 읽음 처리 실패:", err);
    res.status(500).json({ error: "읽음 처리 실패" });
  }
};

exports.readAllMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    await Message.updateMany(
      { chatRoomId: roomId, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );

    res.json({ message: "전체 읽음 처리 완료" });
  } catch (err) {
    console.error("❌ 전체 읽음 처리 실패:", err);
    res.status(500).json({ error: "전체 읽음 처리 실패" });
  }
};

/* ===========================
   ✅ 메시지 고정
=========================== */
exports.pinMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) return res.status(404).json({ error: "채팅방 없음" });

    // 기존 고정 메시지는 히스토리에 저장
    if (chatRoom.pinnedMessage) {
      chatRoom.pinnedHistory.push(chatRoom.pinnedMessage);
    }

    // 새 고정 메시지 설정
    chatRoom.pinnedMessage = messageId;
    await chatRoom.save();

    // ✅ 소켓 브로드캐스트
    const io = req.app.get("io");
    io?.to(roomId).emit("pinnedUpdated", { pinned: messageId });

    res.status(200).json({
      message: "메시지가 고정되었습니다.",
      pinned: messageId,
    });
  } catch (err) {
    console.error("❌ 메시지 고정 실패:", err);
    res.status(500).json({ error: "메시지 고정 실패" });
  }
};


/* ===========================
   ✅ 파일 모아보기
=========================== */
exports.getFiles = async (req, res) => {
  try {
    const { roomId } = req.params;
    const files = await Message.find({ chatRoomId: roomId, type: "file" })
      .populate("sender", "username")
      .sort({ createdAt: -1 });

    res.status(200).json(files);
  } catch (err) {
    console.error("❌ 파일 목록 조회 실패:", err);
    res.status(500).json({ error: "파일 목록 조회 실패" });
  }
};

/* ===========================
   ✅ 이미지 모아보기
=========================== */
exports.getImages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const images = await Message.find({ chatRoomId: roomId, type: "image" })
      .populate("sender", "username")
      .sort({ createdAt: -1 });

    res.status(200).json(images);
  } catch (err) {
    console.error("❌ 이미지 목록 조회 실패:", err);
    res.status(500).json({ error: "이미지 목록 조회 실패" });
  }
};

/* ===========================
   ✅ 메시지 검색
=========================== */
exports.searchMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { keyword } = req.query;

    if (!keyword) return res.status(400).json({ error: "검색어가 필요합니다." });

    const regex = new RegExp(keyword, "i");
    const results = await Message.find({
      chatRoomId: roomId,
      $or: [
        { content: regex },
        { "poll.question": regex },
      ],
    }).populate("sender", "username");

    res.status(200).json(results);
  } catch (err) {
    console.error("❌ 메시지 검색 실패:", err);
    res.status(500).json({ error: "메시지 검색 실패" });
  }
};

/* ===========================
   ✅ 투표 참여
=========================== */
exports.votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, optionIndex } = req.body;

    const message = await Message.findById(messageId);
    if (!message || message.type !== "poll") {
      return res.status(404).json({ error: "투표 메시지를 찾을 수 없음" });
    }

    // 기존 투표 제거 (중복 방지)
    message.poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v.toString() !== userId);
    });

    message.poll.options[optionIndex].votes.push(userId);
    await message.save();

    res.status(200).json({ message: "투표 완료", poll: message.poll });
  } catch (err) {
    console.error("❌ 투표 실패:", err);
    res.status(500).json({ error: "투표 실패" });
  }
};
