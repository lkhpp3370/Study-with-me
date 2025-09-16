const Comment = require('../models/Comment');
const Study = require('../models/Study');

// GET /comments/:studyId?viewerId=xxx
// 비밀댓글은 작성자 또는 스터디장만 내용 노출. 그 외에는 마스킹 문구로 반환.
exports.getComments = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { viewerId } = req.query; // 현재 열람자 (옵션)

    const study = await Study.findById(studyId).select('host');
    if (!study) return res.status(404).json({ message: '스터디를 찾을 수 없습니다.' });

    const rows = await Comment.find({ study: studyId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    const isHost = viewerId && String(study.host) === String(viewerId);

    const items = rows.map(c => {
      const canSee = isHost || (viewerId && String(c.user._id) === String(viewerId));
      return {
        _id: c._id,
        user: c.user,
        isSecret: c.isSecret,
        createdAt: c.createdAt,
        content: c.isSecret && !canSee ? '사용자가 작성한 비밀 댓글입니다.' : c.content
      };
    });

    res.json(items);
  } catch (err) {
    console.error('❌ 댓글 조회 실패:', err);
    res.status(500).json({ message: '댓글 조회 실패', error: err.message });
  }
};

// POST /comments/:studyId
// body: { userId, content, isSecret }
exports.createComment = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { userId, content, isSecret } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ message: 'userId, content는 필수입니다.' });
    }

    const comment = await Comment.create({
      study: studyId,
      user: userId,
      content,
      isSecret: !!isSecret,
    });

    const populated = await comment.populate('user', 'username');
    res.status(201).json(populated);
  } catch (err) {
    console.error('❌ 댓글 작성 실패:', err);
    res.status(500).json({ message: '댓글 작성 실패', error: err.message });
  }
};

// DELETE /comments/:commentId (작성자 또는 스터디장)
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    const c = await Comment.findById(commentId).populate('study', 'host');
    if (!c) return res.status(404).json({ message: '댓글이 존재하지 않습니다.' });

    const isOwner = String(c.user) === String(userId);
    const isHost = String(c.study.host) === String(userId);

    if (!isOwner && !isHost) {
      return res.status(403).json({ message: '댓글은 작성자 또는 스터디장만 삭제할 수 있습니다.' });
    }

    await c.deleteOne();
    res.json({ message: '댓글이 성공적으로 삭제되었습니다.' });
  } catch (err) {
    console.error('❌ 댓글 삭제 실패:', err);
    res.status(500).json({ message: '댓글 삭제 실패', error: err.message });
  }
};
