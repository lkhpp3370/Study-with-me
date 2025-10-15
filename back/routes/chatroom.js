const express = require("express");
const router = express.Router();
const chatRoomController = require("../controllers/chatRoomController");

// 📌 채팅방 관련 API
router.get("/user/:userId", chatRoomController.getUserChatRooms);        // 유저가 속한 채팅방 목록
router.post("/", chatRoomController.createChatRoom);                     // 새로운 채팅방 생성
router.patch("/:roomId/notification", chatRoomController.toggleNotification); // 알림 On/Off 설정
router.get("/:roomId", chatRoomController.getRoomInfo);

module.exports = router;
