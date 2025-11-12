const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const User = require("../models/User");
const Study = require("../models/Study");

function buildPreview(msg) {
  if (!msg) return "";
  if (msg.type === "image") return "[이미지]";
  if (msg.type === "file") return "[파일]";
  if (msg.type === "poll") return "[투표]";
  if (typeof msg.content === "string" && msg.content.length > 0) {
    return msg.content.length > 30 ? msg.content.slice(0, 15) + "..." : msg.content;
  }
  return "";
}

/* ✅ 유저의 채팅방 목록 (스터디명/미리보기/알림상태 포함) */
exports.getUserChatRooms = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    const rooms = await ChatRoom.find({ members: userId })
      .populate("members", "username")
      .populate("lastMessage") // ✅ 마지막 메시지 내용도 불러오기
      .sort({ lastMessageAt: -1 });

    const data = await Promise.all(
      rooms.map(async (room) => {
        const study = room.studyId ? await Study.findById(room.studyId) : null;

        // ✅ 미리보기는 DB 필드 우선, 없으면 마지막 메시지 계산
        let lastMessagePreview = room.lastMessagePreview || "";
        if (!lastMessagePreview && room.lastMessage) {
          lastMessagePreview = buildPreview(room.lastMessage);
        }

        const notifyEnabled =
          user.chatNotificationPreferences?.get(room._id.toString()) !== false;

        const unreadCount = await Message.countDocuments({
          chatRoomId: room._id,
          readBy: { $ne: userId },
        });

        return {
          _id: room._id,
          studyId: room.studyId, // ✅ 프론트에서 navigation 등에 필요
          studyTitle: study?.title || "스터디 채팅방", // ✅ Study.js는 title 필드
          memberCount: study?.members?.length || 0, // ✅ 스터디 가입자 기준
          members: room.members, // 프론트에서 필요할 경우 유지
          lastMessagePreview,
          lastMessageAt: room.lastMessageAt,
          notifyEnabled,
          unreadCount,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error("❌ 채팅방 목록 조회 실패:", err);
    res.status(500).json({ error: "채팅방 목록 조회 실패" });
  }
};

/* ===========================
   ✅ 새로운 채팅방 생성
   - 스터디 생성 시 자동으로 채팅방 생성
   - 이미 존재하면 기존 채팅방 반환
=========================== */
exports.createChatRoom = async (req, res) => {
  try {
    const { studyId, members } = req.body;
    let room = await ChatRoom.findOne({ studyId });

    if (!room) {
      room = new ChatRoom({
        studyId,
        members,
        lastMessagePreview: "",
        lastMessageAt: null,
      });
      await room.save();
    }
    res.json(room);
  } catch (err) {
    console.error("❌ 채팅방 생성 실패:", err);
    res.status(500).json({ error: "채팅방 생성 실패" });
  }
};

/* ===========================
   ✅ 채팅방 알림 On/Off
   - 채팅방별 알림 설정 저장
   - User.chatNotificationPreferences(Map) 사용
=========================== */
exports.toggleNotification = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body; // ✅ params → body

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "유저 없음" });

    const current = user.chatNotificationPreferences?.get(roomId);
    const newVal = !(current === false); // 기본 true, false면 true로 반전
    user.chatNotificationPreferences.set(roomId, !newVal);
    await user.save();

    res.json({ roomId, notifyEnabled: !newVal }); // ✅ 프론트에서 즉시 반영 가능
  } catch (err) {
    console.error("❌ 알림 토글 실패:", err);
    res.status(500).json({ error: "알림 토글 실패" });
  }
};
