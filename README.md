vs code
eslint
korean language
prettier
thunder client

node.js (Lts)

front
npm install -g expo-cli (개발용)
npm install -g eas-cli (배포용)  
//node.js 설치 - powershell에서 "node -v", "npm -v"(npm안되면 "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned" y 입력 후 엔터)
npm install // npm install --legacy-peer-deps  (React 버전 충돌 문제시 입력)
npm start (실행)

back
npm install
node seed.js (DB에 seed파일 추가)
node server.js (서버실행)

MongoDB 실행
services.msc

expo go 업데이트 시
vs code의 front 터미널에 
npm install expo@^54.0.0 (54.0.0부분은 최신버전에 맞게 수정해서 입력)
입력하고 front 폴더에서 node_modules,package-lock.json 삭제 후
npm install
그 후 
npx expo start
