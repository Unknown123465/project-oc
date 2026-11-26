# project-oc 개발 환경

[메인 파일로 이동](../README.md)

## 로컬에서 실행하기

### 필요한 것
- Node.js 22
- MySQL 8.0
- npm

### 환경 변수 설정
1. `project-oc/.env-example` 파일을 `.env`로 복사 후 필수 값만 설정하면 됩니다.
   - 필수 값: `DATABASE_URL`, `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_NAME`, `DATABASE_PASSWORD`, `AUTH_SECRET`
   
   나머지 값은 넣지 않아도 실행에 지장은 없고, 해당 값은 `.env-example`을 통해 확인하시면 됩니다.

2. `AUTH_SECRET` 환경 변수 생성 방법<br>
아래 명령을 터미널에 붙여 넣어 실행 후, `.env`에 붙여 넣으세요.
   ```bash
   node -e "console.log('AUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
   ```

### **유의 사항**
  - `DATABASE_`로 시작하는 필수 환경 변수는 같은 개발 DB로 입력해야 합니다.
  `npm run db:push`는 `DATABASE_URL`을 읽고, 나머지 네 개는 앱에서 참고해서 서로 다를 경우 URL에 적은 DB가 없을 때 `DATABASE_URL`에 입력한 DB 이름으로 새 DB가 생길 수 있고, DB가 있을 경우 테이블이 없다는 오류가 발생할 수 있습니다.
  - `npm run db:push`, `prisma db push` 명령은 DB와 스키마를 생성해 주지만, 해당 DB 계정에 생성 권한이 있을 때만 작동합니다.
  - 선택 값 환경 변수를 안 넣어도 앱이 실행되지만, 아래의 기능을 사용할 시 오류가 발생하거나 특정 기능이 비활성화됩니다.
    - 소셜 로그인 환경 변수를 안 넣은 채 소셜 로그인 버튼을 누르면 공급업체 사이트 화면에서 오류가 납니다.
    그러나 일반 회원가입으로 로그인해서 나머지 기능을 사용할 수 있습니다.
    - `GOOGLE_AI_API_KEY` 환경 변수를 안 넣으면 AI로 초안 만들기 기능을 사용할 수 없습니다.
    - 클라우드플레어 R2 환경 변수를 안 넣으면 이미지 업로드 및 `/template/[uuid]` 페이지에서 프로필 이미지를 요청할 수 없습니다.
    - `NEXT_PUBLIC_KAKAO_JS_KEY` 환경 변수를 안 넣으면 프로필 공유 창에서 카카오톡 공유가 비활성화됩니다.
      - 이 환경 변수는 `KAKAO_CLIENT_SECRET`과 별개입니다.
      - 환경 변수를 넣어도 Kakao Developers에서 JavaScript SDK 도메인과 제품 링크 관리의 웹 도메인 두 곳에 사이트 주소(예: `http://localhost:3000`)를 등록해야 공유가 됩니다.
      - 해당 환경 변수는 브라우저 번들에 노출되므로 JavaScript 키만 넣어야 합니다. **REST API 키나 어드민 키를 절대 넣으면 안 됩니다.**

### 실행 방법
```bash
git clone https://github.com/Unknown123465/project-oc.git
cd project-oc/project-oc
npm install
# 여기서 위 문단의 환경 변수 설정을 한 후, 진행해 주세요
npm run db:push # 주의. DATABASE_URL 환경 변수를 반드시 추가하고 진행해 주세요
npm run dev
```

### 테스트 방법
  **주의**: DB 테스트 시 환경 변수에 `DATABASE_TEST_NAME` 키가 있어야 하며, 해당 값으로 그 이름의 DB가 있고 스키마가 들어가 있어야 합니다.
  또한, 개발 DB(`DATABASE_NAME`)와 다른 이름이어야 하고, `DATABASE_HOST` 값이 `localhost`나 `127.0.0.1`이 아니거나 `DATABASE_TEST_NAME`이 없으면 테스트가 진행되지 않습니다.
  이 조치는 운영 DB에서 테스트가 실행되거나 중간에 테스트가 실패하면 테스트 행이 개발 DB에 남지 않도록 일부러 넣은 장치입니다.

1. 테스트 DB에 스키마 넣는 방법
   `prisma.config.ts` 파일이 있는 폴더에서 실행하세요.
   ```bash
   npx prisma db push --url 'mysql://사용자:비밀번호@localhost:3306/테스트DB이름' # 테스트DB이름은 DATABASE_TEST_NAME 값으로 넣어주세요
   ```

2. 앱 테스트 실행
   ```bash
   # 앱 폴더에서 실행
   npm run test:fn # 순수 함수 테스트. DATABASE_TEST_NAME 환경 변수가 없어도 정상적으로 작동됩니다
   npm run test:db # DB 테스트. DATABASE_TEST_NAME 환경 변수와 값에 해당되는 이름이 DB에 있어야 합니다
   npm test # 위 두 테스트를 순서대로 실행
   ```