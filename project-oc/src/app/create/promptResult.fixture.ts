/* AI 응답 스키마(createPromptResultForm)를 통과하는 최소 표본. 테스트 전용이며
   앱 코드에서는 import하지 않는다.

   promptValidator.test.ts와 promptAction.test.ts가 같은 모양을 필요로 해서 한 곳에
   둔다. 테스트 파일에서 다른 테스트 파일을 import하면 그 파일의 describe가 두 번
   수집되므로, 공유할 것은 이렇게 테스트가 아닌 모듈로 뺀다. */

/** 스키마가 요구하는 최소 형태. 확인할 항목만 덮어써서 쓴다. */
export function resultFixture(override: Record<string, unknown> = {}) {
	return {
		layout: {type: "s", reason: "정사각형을 추천합니다", fx: 0.5, fy: 0.5},
		color: "#7c5cff",
		fields: {
			charName: {value: "세라핀"},
			charMessage: {value: "한 줄 소개"},
			charLike: {value: null},
			charHate: {value: null},
			charPersonality: {value: null},
			charTmi: {value: null},
			charKind: {value: null},
			charAge: {value: null},
			charBirthday: {value: null},
			charHeight: {value: null},
			charBirthplace: {value: null},
			charMbti: {value: null},
		},
		...override,
	};
}
