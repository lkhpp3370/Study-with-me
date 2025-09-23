const mongoose = require('mongoose');
const Post = require('../models/Post');

// 🔍 게시글 검색 (제목과 내용 기준, 특정 스터디 내에서)
exports.searchPosts = async (req, res) => {
  try {
    const { keyword } = req.query;
    const { studyId } = req.params;

    if (!keyword) return res.status(400).json({ message: "검색어가 없습니다." });
    if (!studyId) return res.status(400).json({ message: "스터디 ID가 없습니다." });

    const regex = new RegExp(keyword, 'i');
    const results = await Post.find({ 
      study: new mongoose.Types.ObjectId(studyId),
      $or: [
        { title: regex },
        { content: regex }
      ]
    })
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(results);
  } catch (error) {
    console.error("❌ 게시글 검색 오류:", error.message);
    res.status(500).json({ message: "검색 중 오류 발생", error: error.message });
  }
};

// 특정 스터디의 게시글 목록 조회 (카테고리별 필터링 포함)
exports.getPostsByStudy = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { category } = req.query;

    // 💡 유효성 검사 추가: studyId가 유효한 ObjectId인지 확인
    if (!studyId || !mongoose.isValidObjectId(studyId)) {
      console.error("❌ 게시글 조회 오류: 유효하지 않은 studyId입니다.");
      return res.status(400).json({ message: "유효하지 않은 스터디 ID입니다." });
    }

    let filter = { study: new mongoose.Types.ObjectId(studyId) };
    if (category) {
      filter.category = category;
    }

    const posts = await Post.find(filter)
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("❌ 게시글 조회 오류:", error.message);
    res.status(500).json({ message: "게시글 조회 중 오류 발생", error: error.message });
  }
};

// 게시글 등록
// postController.js (수정 후)

// 특정 스터디에 게시글 작성
exports.createPost = async (req, res) => {
  try {
    // 💡 1. 로그인 여부 확인
    if (!req.session.user) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { studyId } = req.params;
    const { title, content, category } = req.body;
    const authorId = req.session.user._id; // 💡 2. 세션에서 사용자 ID 가져오기

    // 입력값 유효성 검사 (필요에 따라 추가)
    if (!title || !content || !category) {
      return res.status(400).json({ message: '제목, 내용, 카테고리는 필수 입력 항목입니다.' });
    }

    // 💡 3. 게시글 생성 시 author 필드에 사용자 ID 추가
    const newPost = new Post({
      study: studyId,
      author: authorId,
      title,
      content,
      category,
    });

    await newPost.save();

    // 4. 게시글 생성 성공 시 응답
    res.status(201).json({ message: '게시글이 성공적으로 작성되었습니다.', post: newPost });
  } catch (error) {
    console.error("❌ 게시글 작성 오류:", error);
    res.status(500).json({ message: '게시글 작성 실패', error: error.message });
  }
};

// 특정 게시글 조회
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

    res.status(200).json(post);
  } catch (error) {
    console.error("❌ 게시글 조회 오류:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 게시글 수정
exports.updatePost = async (req, res) => {
  try {
    // 💡 1. 로그인 상태 확인
    if (!req.session.user) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const post = await Post.findById(req.params.id);
    // 💡 2. 게시글 존재 여부 확인
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 💡 3. 권한 확인: 게시글 작성자와 현재 로그인한 사용자가 동일한지 비교
    if (post.author.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ message: '수정 권한이 없습니다.' });
    }

    const { title, content, category } = req.body;

    // 카테고리 유효성 검사 (기존 로직 유지)
    if (category) {
      const validCategories = ['NOTICE', 'QNA', 'FREE'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: "유효하지 않은 카테고리입니다." });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, category, updatedAt: new Date() }, // updatedAt 필드 수동 갱신 (선택 사항, 스키마 pre 훅이 있다면 필요 없음)
      { new: true, runValidators: true }
    ).populate('author', 'username');

    res.json(updatedPost);
  } catch (error) {
    console.error("❌ 게시글 수정 오류:", error.message);
    res.status(500).json({ message: "게시글 수정 실패", error: error.message });
  }
};


// 게시글 삭제
exports.deletePost = async (req, res) => {
  try {
    // 💡 1. 로그인 상태 확인
    if (!req.session.user) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const post = await Post.findById(req.params.id);
    // 💡 2. 게시글 존재 여부 확인
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 💡 3. 권한 확인: 게시글 작성자와 현재 로그인한 사용자가 동일한지 비교
    if (post.author.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: '게시글이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error("❌ 게시글 삭제 오류:", error.message);
    res.status(500).json({ message: "게시글 삭제 실패", error: error.message });
  }
};