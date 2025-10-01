const Comment = require('../models/PostComment');
const Post = require('../models/Post'); // 게시글 유효성 확인용
const mongoose = require('mongoose'); // 💡 Mongoose 모듈 추가

// 1. 댓글 작성
exports.createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, authorId } = req.body; // 프론트에서 postId와 authorId를 body로 전달한다고 가정

    if (!authorId && !req.session.user) { // 💡 세션 로그인 대신 authorId를 우선 확인
      return res.status(401).json({ message: '로그인 정보 또는 작성자 ID가 필요합니다.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
    }
    
    // 💡 작성자 ID 준비: body의 authorId를 우선 사용
    const actualAuthorId = authorId || req.session.user._id;

    // 💡 ObjectId 유효성 검사 (매우 중요): 유효하지 않은 ID 형식이라면 에러 처리
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(actualAuthorId)) {
        return res.status(400).json({ message: '유효하지 않은 게시글 ID 또는 작성자 ID입니다.' });
    }

    // 게시글 유효성 확인
    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json({ message: '해당 게시글을 찾을 수 없습니다.' });
    }

    const newComment = new Comment({
      // 💡 명시적으로 ObjectId로 변환하여 할당 (authorId는 string이므로)
      post: new mongoose.Types.ObjectId(postId),
      author: new mongoose.Types.ObjectId(actualAuthorId), 
      content: content.trim(),
    });

    await newComment.save();
    
    // 댓글 목록에 표시할 수 있도록 작성자 정보 populate하여 응답
    await newComment.populate('author', 'username'); 
    
    res.status(201).json({ message: '댓글 작성 성공', comment: newComment });
    
  } catch (error) {
    // 💡 오류 로그 강화: 발생한 에러 객체를 명확히 출력
    console.error('❌ 댓글 작성 서버 실패 (createComment):', error);
    
    // Mongoose 유효성 검사 오류인 경우
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: '입력 데이터 유효성 검사 실패', error: error.message });
    }
    
    res.status(500).json({ message: '댓글 작성 실패 (서버 오류)', error: error.message });
  }
};

// 2. 게시글의 모든 댓글 조회
exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    // 💡 ObjectId 유효성 검사 추가
    if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({ message: '유효하지 않은 게시글 ID입니다.' });
    }

    const comments = await Comment.find({ post: postId })
      .populate('author', 'username') // 작성자 이름 정보를 함께 가져옴
      .sort({ createdAt: 1 }); // 오래된 댓글부터 정렬
      
    res.status(200).json(comments);
  } catch (error) {
    console.error('❌ 댓글 조회 실패:', error);
    res.status(500).json({ message: '댓글 조회 실패', error: error.message });
  }
};

// 3. 댓글 삭제 (추가 권한 로직 필요)
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body; // 삭제 요청을 보낸 사용자 ID (스터디장 ID는 댓글 객체에서 확인)

    // 💡 ObjectId 유효성 검사 추가
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: '유효하지 않은 ID 형식입니다.' });
    }

    const comment = await Comment.findById(commentId).populate({
        path: 'post',
        populate: { path: 'study', select: 'host' }
    });
    
    if (!comment) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    const isAuthor = comment.author.toString() === userId;
    
    // 💡 스터디장 권한 확인 로직 수정: studyHostId를 post 객체의 study.host에서 직접 가져와 userId와 비교
    const studyHostId = comment.post.study?.host?.toString(); 
    const isStudyHost = studyHostId && studyHostId === userId;

    if (!isAuthor && !isStudyHost) {
        return res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: '댓글 삭제 성공' });

  } catch (error) {
    console.error('❌ 댓글 삭제 실패:', error);
    res.status(500).json({ message: '댓글 삭제 실패', error: error.message });
  }
};
