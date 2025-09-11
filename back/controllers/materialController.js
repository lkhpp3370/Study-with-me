const Material = require('../models/Material');
const fs = require('fs');
const path = require('path');

// 📁 파일 업로드
exports.uploadMaterial = async (req, res) => {
  console.log('업로드 요청 도착');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);

  try {
    if (!req.file) return res.status(400).json({ error: '파일이 첨부되지 않았습니다.' });
    // 프론트엔드에서 folderId를 보내주면 해당 폴더에 연결
    const folderId = req.body.folderId; // 프론트엔드에서 selectedFolderId를 folderId로 보낼 예정

    const material = new Material({
      title: req.body.title || req.file.originalname,
      filename: req.file.originalname,
      filepath: req.file.path,
      uploader: req.body.uploader, // 필요시 uploader도 req.body에서 받아서 처리
      folder: folderId || null, // folderId가 없으면 null (기타 폴더에 해당)
    });

    await material.save();
    res.status(201).json({ message: '파일 업로드 성공', material });
  } catch (error) {
    console.error('업로드 서버 에러:', error);
    res.status(500).json({ message: error.message });
  }
};

// 📄 전체 파일 목록 조회 (폴더 ID로 필터링 가능)
exports.getAllFiles = async (req, res) => {
  try {
    const { folderId } = req.query; // 프론트엔드에서 folderId를 쿼리 파라미터로 보낼 수 있음
    let query = {};

    if (folderId) {
        if (folderId === 'no-folder') { // '기타' 폴더를 위한 특별한 ID
            query.folder = null; // folder 필드가 null인 자료 조회
        } else {
            query.folder = folderId; // 특정 폴더에 속한 자료 조회
        }
    }
    // Material 문서를 조회하고, 'folder' 필드를 populate하여 폴더 정보를 함께 가져옴
    const files = await Material.find(query).populate('folder').sort({ createdAt: -1 });
    res.status(200).json(files);
  } catch (err) {
    console.error('파일 목록 조회 실패:', err);
    res.status(500).json({ error: '파일 목록 조회 실패' });
  }
};

// 🔍 제목 검색 (폴더 ID로 필터링 가능)
exports.searchMaterials = async (req, res) => {
  try {
    const { keyword, folderId } = req.query; // folderId로 필터링 추가
    if (!keyword) return res.status(400).json({ message: "검색어가 없습니다." });

    const regex = new RegExp(keyword, 'i');
    let query = { title: regex }; // Material의 title 필드를 검색

    if (folderId) {
        if (folderId === 'no-folder') {
            query.folder = null;
        } else {
            query.folder = folderId;
        }
    }
    // 폴더 정보도 함께 populate하여 반환
    const results = await Material.find(query).populate('folder');
    res.status(200).json(results);
  } catch (error) {
    console.error('검색 중 오류 발생:', error);
    res.status(500).json({ message: "검색 중 오류 발생", error: error.message });
  }
};

// 📄 파일 삭제
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    // 실제 파일 삭제
    if (fs.existsSync(material.filepath)) {
      fs.unlinkSync(material.filepath);
    }
    await Material.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: '파일 삭제 성공' });
  } catch (err) {
    console.error('파일 삭제 실패:', err);
    res.status(500).json({ error: err.message });
  }
};

// 📄 파일 제목 변경
exports.renameMaterial = async (req, res) => {
  try {
    const { name } = req.body; // 프론트엔드에서 'name'으로 새 제목을 보냅니다.
    const material = await Material.findByIdAndUpdate(req.params.id, { title: name }, { new: true });
    if (!material) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    res.status(200).json({ message: '제목 수정 성공', material });
  } catch (err) {
    console.error('파일 제목 변경 실패:', err);
    res.status(500).json({ error: err.message });
  }
};
