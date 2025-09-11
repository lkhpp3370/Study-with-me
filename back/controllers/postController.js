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

    if (!studyId) return res.status(400).json({ message: "스터디 ID가 없습니다." });

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
exports.createPost = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { studyId } = req.params;
    const { title, content, category } = req.body;

    if (!studyId) return res.status(400).json({ message: "스터디 ID가 없습니다." });
    if (!title || !content || !category) {
      return res.status(400).json({ message: "제목, 내용, 카테고리는 필수입니다." });
    }

    const validCategories = ['NOTICE', 'QNA', 'FREE'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "유효하지 않은 카테고리입니다." });
    }

    const post = new Post({
      study: new mongoose.Types.ObjectId(studyId),
      title,
      content,
      category,
      author: req.session.user._id
    });

    await post.save();

    const createdPost = await Post.findById(post._id).populate('author', 'username');
    res.status(201).json(createdPost);
  } catch (error) {
    console.error("❌ 게시글 등록 오류:", error.message);
    res.status(500).json({ message: error.message });
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
    if (!req.session.user) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

    if (post.author.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ message: '수정 권한이 없습니다.' });
    }

    const { title, content, category } = req.body;

    if (category) {
      const validCategories = ['NOTICE', 'QNA', 'FREE'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: "유효하지 않은 카테고리입니다." });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, category },
      { new: true }
    ).populate('author', 'username');

    res.json(updatedPost);
  } catch (error) {
    console.error("❌ 게시글 수정 오류:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 게시글 삭제
exports.deletePost = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

    if (post.author.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: '게시글 삭제 성공' });
  } catch (error) {
    console.error("❌ 게시글 삭제 오류:", error.message);
    res.status(500).json({ message: error.message });
  }
};
