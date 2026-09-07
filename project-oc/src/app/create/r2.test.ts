import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {charImageBucket, charImageKey, charImageTempKey} from "./r2";

/* 여기서 정하는 건 "어느 버킷, 어느 키"뿐이지만 그게 곧 접근 제어다.
   R2는 오브젝트 단위 ACL이 없어 공개 여부가 버킷으로만 갈리고,
   키 앞의 업로더 id가 남의 오브젝트를 가리키지 못하게 하는 유일한 장치다. */

const PUBLIC_BUCKET: string = "oc-public";
const PRIVATE_BUCKET: string = "oc-private";

const USER_ID: string = "clx0000000000000000000000";
const IMAGE_NAME: string = "0f8fad5b-d9cb-469f-a165-70867728950e.png";

beforeEach(() => {
	process.env.R2_PUBLIC_BUCKET = PUBLIC_BUCKET;
	process.env.R2_PRIVATE_BUCKET = PRIVATE_BUCKET;
});

afterEach(() => {
	delete process.env.R2_PUBLIC_BUCKET;
	delete process.env.R2_PRIVATE_BUCKET;
});

describe("공개 범위별 버킷 분리", () => {
	it("공개(0)만 공개 버킷으로 간다", () => {
		expect(charImageBucket(0)).toBe(PUBLIC_BUCKET);
	});

	/* 일부공개(1)를 공개 버킷에 두면 커스텀 도메인으로 파일명만 알아도 열린다.
	   "서명된 URL로만 접근"이 성립하려면 버킷 자체가 달라야 한다. */
	it("일부공개(1)와 비공개(2)는 비공개 버킷으로 간다", () => {
		expect(charImageBucket(1)).toBe(PRIVATE_BUCKET);
		expect(charImageBucket(2)).toBe(PRIVATE_BUCKET);
	});

	it("알 수 없는 값은 공개 버킷으로 새지 않는다", () => {
		expect(charImageBucket(3)).toBe(PRIVATE_BUCKET);
		expect(charImageBucket(-1)).toBe(PRIVATE_BUCKET);
		expect(charImageBucket(Number.NaN)).toBe(PRIVATE_BUCKET);
	});

	it("버킷 환경 변수가 비어 있으면 조용히 넘어가지 않는다", () => {
		delete process.env.R2_PUBLIC_BUCKET;

		expect(() => charImageBucket(0)).toThrow();
	});
});

describe("오브젝트 키", () => {
	it("최종 경로는 업로더 id로 갈린다", () => {
		expect(charImageKey(USER_ID, IMAGE_NAME)).toBe(`characters/${USER_ID}/${IMAGE_NAME}`);
	});

	/* 브라우저에 내주는 서명은 tmp/ 경로에만 붙는다. 두 경로가 겹치면
	   서명을 쥔 쪽이 이미 등록된 남의 이미지를 덮어쓸 수 있다. */
	it("임시 경로는 tmp/ 아래에 따로 있다", () => {
		const tempKey: string = charImageTempKey(USER_ID, IMAGE_NAME);

		expect(tempKey.startsWith("tmp/")).toBe(true);
		expect(tempKey).not.toBe(charImageKey(USER_ID, IMAGE_NAME));
	});

	it("두 경로 모두 업로더 id를 접두어로 둔다", () => {
		expect(charImageKey(USER_ID, IMAGE_NAME)).toContain(`/${USER_ID}/`);
		expect(charImageTempKey(USER_ID, IMAGE_NAME)).toContain(`/${USER_ID}/`);
	});

	it("사용자마다 키가 갈린다", () => {
		expect(charImageKey("userA", IMAGE_NAME)).not.toBe(charImageKey("userB", IMAGE_NAME));
	});
});
