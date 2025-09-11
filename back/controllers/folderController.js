const Folder = require('../models/Folder');
const Material = require('../models/Material'); // Material 모델 불러오기 (폴더 삭제 시 파일 처리 위함)
const Study = require('../models/Study'); // Study 모델 불러오기 (스터디 폴더 생성/조회 위함)

exports.createFolder = async (req, res) => {
  try {
    const { name, ownerId, studyId, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: '폴더 이름은 필수입니다.' });
    }
    let existingFolderQuery = { name };
    if (ownerId) existingFolderQuery.owner = ownerId;
    if (studyId) existingFolderQuery.study = studyId;
    const existingFolder = await Folder.findOne(existingFolderQuery);
    if (existingFolder) {
      return res.status(409).json({ message: '동일한 이름의 폴더가 이미 존재합니다.' });
    }

    // ownerId가 있을 때만 owner 필드 추가
    const newFolderData = {
      name,
      description,
      study: studyId || null,
    };
    if (ownerId) newFolderData.owner = ownerId;

    const newFolder = new Folder(newFolderData);
    await newFolder.save();
    res.status(201).json({ message: '폴더 생성 성공', folder: newFolder });
  } catch (error) {
    console.error('폴더 생성 서버 에러:', error);
    res.status(500).json({ message: '폴더 생성 실패', error: error.message });
  }
};
// 모든 폴더 목록 조회 (필터링 옵션 포함)
exports.getAllFolders = async (req, res) => {
  try {
    const { ownerId, studyId } = req.query;
    let query = {};

    if (ownerId) {
      query.owner = ownerId; // 특정 사용자의 개인 폴더 조회
    }
    if (studyId) {
      query.study = studyId; // 특정 스터디에 연결된 폴더 조회
    }
    // owner와 study가 모두 null인 폴더도 조회 가능 (예: 공개 폴더)
    // 쿼리 조건에 따라 owner나 study가 null인 폴더만 가져올 수도 있음
    // 예: ownerId='null' -> owner가 null인 폴더만
    // 예: studyId='null' -> study가 null인 폴더만 (개인 폴더)
    const folders = await Folder.find(query).sort({ createdAt: -1 });
    // 프론트엔드의 folder 객체 구조에 맞추기 위해 _id를 id로, name을 name으로 매핑
    const formattedFolders = folders.map(folder => ({
      id: folder._id,
      name: folder.name,
      // 기타 필요한 folder 정보
      ownerId: folder.owner,
      studyId: folder.study,
      // 해당 폴더에 속한 파일 수를 미리 계산하려면 여기에 Material.countDocuments를 사용해야 합니다.
      // (성능 고려하여 별도 API 또는 프론트에서 집계 권장)
    }));
    res.status(200).json(formattedFolders);
  } catch (err) {
    console.error('폴더 목록 조회 실패:', err);
    res.status(500).json({ error: '폴더 목록 조회 실패', detail: err.message });
  }
};
// 폴더 이름 변경
exports.renameFolder = async (req, res) => {
  try {
    const { id } = req.params; // 폴더의 _id
    const { newName } = req.body; // 새 이름
    if (!newName) {
      return res.status(400).json({ message: '새 폴더 이름은 필수입니다.' });
    }
    const updatedFolder = await Folder.findByIdAndUpdate(
      id,
      { name: newName },
      { new: true, runValidators: true }
    );
    if (!updatedFolder) {
      return res.status(404).json({ message: '폴더를 찾을 수 없습니다.' });
    }
    res.status(200).json({ message: '폴더 이름 변경 성공', folder: updatedFolder });
  } catch (error) {
    console.error('폴더 이름 변경 서버 에러:', error);
    res.status(500).json({ message: '폴더 이름 변경 실패', error: error.message });
  }
};
// 폴더 삭제
exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params; // 폴더의 _id
    // 1. 해당 폴더 문서 삭제
    const deletedFolder = await Folder.findByIdAndDelete(id);
    if (!deletedFolder) {
      return res.status(404).json({ message: '폴더를 찾을 수 없습니다.' });
    }
    // 2. 해당 폴더에 속한 Material 문서들의 folder 필드를 null로 설정 (선택 사항)
    // 이 방식은 폴더 삭제 시 파일을 함께 삭제하지 않고 '미분류'로 만드는 효과가 있습니다.
    // 만약 폴더 삭제 시 해당 폴더의 모든 파일을 함께 삭제하려면 Material.deleteMany({ folder: id })를 사용하세요.
    await Material.updateMany(
      { folder: id },
      { $unset: { folder: 1 } } // folder 필드를 제거합니다.
      // 또는 { folder: null } 로 설정할 수도 있습니다.
    );
    res.status(200).json({ message: '폴더 삭제 성공', folder: deletedFolder });
  } catch (error) {
    console.error('폴더 삭제 서버 에러:', error);
    res.status(500).json({ message: '폴더 삭제 실패', error: error.message });
  }
};
