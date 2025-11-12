const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const upload = require("../middleware/chatUpload");

// 📌 메시지 관련 API
router.post("/:roomId/messages", chatController.sendMessage);                            // 텍스트/투표 메시지
router.post("/:roomId/messages/image", upload.single("file"), chatController.sendImageMessage); // 단일 이미지
router.post("/:roomId/messages/images", upload.array("files", 10), chatController.sendMultipleImages); // 다중 이미지 (최대 10장)
router.post("/:roomId/messages/file", upload.single("file"), chatController.sendFileMessage);   // 파일 업로드
router.get("/:roomId/messages", chatController.getMessages);                             // 메시지 불러오기
router.patch("/:roomId/messages/:messageId/read", chatController.readMessage);           // 읽음 처리
router.patch("/:roomId/readAll", chatController.readAllMessages);
router.post("/:roomId/messages/:messageId/pin", chatController.pinMessage);              // 메시지 고정
router.get("/:roomId/files", chatController.getFiles);                                   // 파일 모아보기
router.get("/:roomId/images", chatController.getImages);                                 // 이미지 모아보기
router.get("/:roomId/search", chatController.searchMessages);                            // 메시지 검색
router.post("/:roomId/poll/:messageId/vote", chatController.votePoll);                   // 투표 참여

module.exports = router;
