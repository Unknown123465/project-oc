# 프로젝트 OC 리메이크 목업

기존 HTML 15개를 공용 디자인 시스템으로 다시 구성한 정적 목업입니다. 모든 화면은 `assets/styles.css`와 `assets/app.js`를 공유하며, 별도의 설치 과정 없이 `index.html`부터 열 수 있습니다.

| 기존 화면 | 리메이크 화면 |
| --- | --- |
| 프로젝트OC 메인 페이지 | `index.html` |
| 프로젝트OC 로그인 | `login.html` |
| 프로젝트OC 회원가입 | `signup.html` |
| 템플릿 둘러보기, 로그아웃 | `browse-guest.html` |
| 템플릿 둘러보기, 템플릿 0개 | `browse-empty.html` |
| 템플릿 둘러보기, 템플릿 제작 | `browse.html` |
| 캐릭터 생성 | `create.html` |
| 내 캐릭터 모음 | `my-characters.html` |
| 계정 설정 | `settings.html` |
| 일반 404 | `404.html` |
| 캐릭터 404 | `character-404.html` |
| 프로필 가로형 | `profile-horizontal.html` |
| 프로필 세로형 | `profile-vertical.html` |
| 프로필 정사각형 | `profile-square.html` |
| 프로필 카드 | `profile-card.html` |

## 주요 동작

- 밝은 화면과 어두운 화면 전환
- 검색, 필터, 빈 결과 처리
- 로그인과 회원가입 입력 검증
- 프로필 작성과 실시간 미리보기
- 이미지 유형 선택, 드래그 영역 편집, 사각형·타원 프레임 적용
- 좋아요, 공유 링크 복사, 코멘트 작성
- 모바일 메뉴와 제작 화면 탭 전환
