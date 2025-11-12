const Material = require('../models/Material');
const Folder = require('../models/Folder');
const Study = require('../models/Study');
const fs = require('fs');
const path = require('path');

// 📄 파일 업로드 (POST)
exports.uploadMaterial = async (req, res) => {
  try {
    const { studyId } = req.params;
    if (!req.file) return res.status(400).json({ error: '파일이 첨부되지 않았습니다.' });
    const { folderId, uploader } = req.body;
    
    const folder = await Folder.findById(folderId);
    if (!folder || folder.study.toString() !== studyId) {
        return res.status(403).json({ error: '해당 스터디에 속하지 않은 폴더에는 파일을 업로드할 수 없습니다.' });
    }
    const relativePath = path.join('uploads', 'materials', path.basename(req.file.path));

    const material = new Material({
      title: req.body.title || req.file.originalname,
      filename: req.file.originalname,
      filepath: relativePath,
      uploader: uploader,
      folder: folderId,
    });
    await material.save();
    res.status(201).json({ message: '파일 업로드 성공', material });
  } catch (err) {
    console.error('파일 업로드 실패:', err);
    res.status(500).json({ error: err.message });
  }
};

// 📄 모든 자료(파일) 목록 조회 (GET)
exports.getAllFiles = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { folderId } = req.query;
    
    let query = {};
    if (folderId && folderId !== 'no-folder') {
      const folder = await Folder.findById(folderId);
      if (folder && folder.study.toString() === studyId) {
        query.folder = folderId;
      } else {
        return res.status(404).json({ message: '폴더를 찾을 수 없거나 해당 스터디에 속하지 않습니다.' });
      }
    } else {
      const studyFolders = await Folder.find({ study: studyId });
      const folderIds = studyFolders.map(f => f._id);
      query.folder = { $in: folderIds };
    }
    const files = await Material.find(query).populate({
      path: 'folder',
      populate: { path: 'study' }
    });
    res.status(200).json(files);
  } catch (err) {
    console.error('파일 목록 조회 실패:', err);
    res.status(500).json({ error: err.message });
  }
};

// 📄 파일 삭제 (DELETE)
exports.deleteMaterial = async (req, res) => {
  try {
    const { studyId, id } = req.params;
    const { userId } = req.body;

    const material = await Material.findById(id).populate({
      path: 'folder',
      populate: { path: 'study' }
    });

    if (!material) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });

    const isUploader = material.uploader.toString() === userId;
    const isStudyHost = material.folder.study.host._id.toString() === userId;
    
    if (!isUploader && !isStudyHost) {
      return res.status(403).json({ error: '파일을 삭제할 권한이 없습니다.' });
    }

    // 💡 수정: 파일 경로를 절대 경로로 변환하여 사용
    const absolutePath = path.join(__dirname, '..', material.filepath);
    
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
    await Material.findByIdAndDelete(id);
    res.status(200).json({ message: '파일 삭제 성공' });
  } catch (err) {
    console.error('파일 삭제 실패:', err);
    res.status(500).json({ error: err.message });
  }
};

// 📄 파일 제목 변경 (PATCH)
exports.renameMaterial = async (req, res) => {
  try {
    const { studyId, id } = req.params;
    const { name, userId } = req.body;

    const material = await Material.findById(id).populate({
      path: 'folder',
      populate: { path: 'study' }
    });

    if (!material) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });

    const isUploader = material.uploader.toString() === userId;
    const isStudyHost = material.folder.study.host._id.toString() === userId;

    if (!isUploader && !isStudyHost) {
      return res.status(403).json({ error: '파일 이름을 변경할 권한이 없습니다.' });
    }
    material.title = name;
    await material.save();
    res.status(200).json({ message: '제목 수정 성공', material });
  } catch (err) {
    console.error('파일 제목 변경 실패:', err);
    res.status(500).json({ error: err.message });
  }
};

// 🔍 제목 검색 (폴더 ID로 필터링 가능)
exports.searchMaterials = async (req, res) => {
  try {
    const { studyId } = req.params; // 💡 변경: URL에서 studyId 가져오기
    const { keyword, folderId } = req.query;
    if (!keyword) return res.status(400).json({ message: "검색어가 없습니다." });

    // 💡 변경: 스터디에 속한 폴더들의 ID를 먼저 조회
    const foldersInStudy = await Folder.find({ study: studyId });
    const folderIdsInStudy = foldersInStudy.map(folder => folder._id);

    const regex = new RegExp(keyword, 'i');
    let query = { title: regex };

    if (folderId) {
        // 💡 변경: 요청된 folderId가 해당 스터디에 속하는지 확인
        if (!folderIdsInStudy.some(id => id.toString() === folderId)) {
            return res.status(403).json({ error: '해당 스터디에 속하지 않은 폴더입니다.' });
        }
        query.folder = folderId;
    } else {
        // 💡 변경: folderId가 없으면 해당 스터디의 모든 폴더에 속한 자료에서 검색
        query.folder = { $in: folderIdsInStudy };
    }

    const results = await Material.find(query).populate('folder');
    res.status(200).json(results);
  } catch (error) {
    console.error('검색 중 오류 발생:', error);
    res.status(500).json({ message: "검색 중 오류 발생", error: error.message });
  }
};