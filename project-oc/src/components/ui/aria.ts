/** 입력이 가리킬 설명 요소가 여럿일 때 aria-describedby 한 줄로 잇는다.
    가리킬 것이 하나도 없으면 undefined를 돌려줘 속성 자체가 붙지 않게 한다.
    `errors.x && id`를 그대로 넘길 수 있도록 false와 undefined를 함께 받는다. */
export function describedBy(...ids: (string | false | undefined)[]): string | undefined {
	return ids.filter(Boolean).join(" ") || undefined;
}
