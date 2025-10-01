const Folder = require('../models/Folder');
const Material = require('../models/Material');
const Study = require('../models/Study');

// 📁 새 폴더 생성
exports.createFolder = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { name, userId, description } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ message: '폴더 이름과 사용자 ID는 필수입니다.' });
    }

    const existingFolder = await Folder.findOne({ name, study: studyId });
    if (existingFolder) {
      return res.status(409).json({ message: '동일한 이름의 폴더가 이미 존재합니다.' });
    }

    const newFolder = new Folder({
      name: name.trim(),
      owner: userId, // 💡 변경: userId를 owner로 저장
      study: studyId,
      description,
    });
    await newFolder.save();
    res.status(201).json({ message: '폴더 생성 성공', folder: newFolder });
  } catch (error) {
    console.error('폴더 생성 서버 에러:', error);
    res.status(500).json({ message: '폴더 생성 실패', error: error.message });
  }
};

// 📁 모든 폴더 목록 조회 (GET)
exports.getAllFolders = async (req, res) => {
  try {
    const { studyId } = req.params;
    const folders = await Folder.find({ study: studyId }).populate('study');
    res.status(200).json(folders);
  } catch (error) {
    console.error('폴더 목록 조회 실패:', error);
    res.status(500).json({ message: '폴더 목록 조회 실패', error: error.message });
  }
};

// 📁 폴더 이름 변경 (PATCH)
exports.renameFolder = async (req, res) => {
  try {
    const { id, studyId } = req.params;
    const { newName, userId } = req.body;
    
    if (!newName) {
      return res.status(400).json({ message: '새 폴더 이름은 필수입니다.' });
    }
    const folder = await Folder.findById(id).populate('owner').populate('study');

    if (!folder) {
        return res.status(404).json({ message: '폴더를 찾을 수 없습니다.' });
    }
    if (folder.study._id.toString() !== studyId) {
        return res.status(403).json({ message: '해당 스터디에 속하지 않는 폴더입니다.' });
    }
    const isOwner = folder.owner?._id?.toString() === userId;
    const isStudyHost = folder.study.host._id.toString() === userId;

    if (!isOwner && !isStudyHost) {
        return res.status(403).json({ message: '폴더 이름을 변경할 권한이 없습니다.' });
    }
    folder.name = newName.trim();
    await folder.save();
    res.status(200).json({ message: '폴더 이름 변경 성공', folder });
  } catch (error) {
    console.error('폴더 이름 변경 서버 에러:', error);
    res.status(500).json({ message: '폴더 이름 변경 실패', error: error.message });
  }
};

// 📁 폴더 삭제 (DELETE)
exports.deleteFolder = async (req, res) => {
  try {
    const { id, studyId } = req.params;
    const { userId } = req.body;

    const folder = await Folder.findById(id).populate('owner').populate('study');
    if (!folder) {
        return res.status(404).json({ message: '폴더를 찾을 수 없습니다.' });
    }
    if (folder.study._id.toString() !== studyId) {
        return res.status(403).json({ message: '해당 스터디에 속하지 않는 폴더입니다.' });
    }
    const isOwner = folder.owner?._id?.toString() === userId;
    const isStudyHost = folder.study.host._id.toString() === userId;

    if (!isOwner && !isStudyHost) {
        return res.status(403).json({ message: '폴더를 삭제할 권한이 없습니다.' });
    }
    const filesInFolder = await Material.countDocuments({ folder: id });
    if (filesInFolder > 0) {
        return res.status(409).json({ message: '폴더 내에 파일이 존재하여 삭제할 수 없습니다.' });
    }
    await Folder.findOneAndDelete({ _id: id, study: studyId });
    res.status(200).json({ message: '폴더 삭제 성공' });

  } catch (error) {
    console.error('폴더 삭제 서버 에러:', error);
    res.status(500).json({ message: '폴더 삭제 실패', error: error.message });
  }
};