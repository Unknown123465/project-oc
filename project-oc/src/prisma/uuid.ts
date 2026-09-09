/* charPublicLink는 BINARY(16)이다. 문자열 그대로 CHAR(36)에 넣으면 한 행마다
   20바이트가 더 붙고 유니크 인덱스도 그만큼 두꺼워지는데, 공개 링크 조회는 이
   인덱스를 단건으로 타는 경로라 컬럼 폭이 곧 조회 비용이 된다.

   대신 DB에 들어가는 형태와 사람이 주소창에서 보는 형태가 갈라지므로, 그 경계의
   변환을 이 파일 한 곳에 모은다. 쓰기(생성 액션)와 읽기(프로필 조회)가 서로 다른
   라우트에 있어 한쪽에 두면 다른 쪽이 반대 방향 함수를 다시 만들게 된다. */

const UUID_BYTE_LENGTH: number = 16;

/* 하이픈 위치. UUID는 8-4-4-4-12로 끊는다. */
const UUID_SEGMENTS: readonly number[] = [8, 4, 4, 4, 12];

/* Buffer.from(_, "hex")에 형식 검사를 맡기지 않는다. 16진수가 아닌 글자를 만나면
   예외 대신 그 지점까지만 잘라서 돌려주고, 한 자 더 붙은 33자리는 남는 반 바이트만
   버려져 결과가 정확히 16바이트가 된다. 즉 변환 결과의 길이만 봐서는 "조용히 잘린
   다른 UUID"를 정상으로 통과시킨다. 그래서 변환 전에 형식을 직접 확인한다. */
const UUID_HEX_PATTERN: RegExp = /^[0-9a-f]{32}$/i;

/* 주소창에서 받은 값을 그대로 uuidToBin에 넣으면 형식이 틀렸을 때 예외가 올라가
   404가 아니라 500이 된다. 링크는 아무나 손으로 고쳐 볼 수 있는 값이라 "틀린 형식"은
   장애가 아니라 없는 페이지로 다뤄야 한다. 그 판단을 던지지 않는 함수로 따로 낸다.

   uuidToBin과 달리 하이픈 위치까지 본다. 읽기 경로는 링크가 곧 주소라, 하이픈만
   뺀 32자리도 같이 통과시키면 같은 캐릭터가 서로 다른 주소 두 개로 열린다. */
const UUID_PATTERN: RegExp = new RegExp(`^${UUID_SEGMENTS.map((length) => `[0-9a-f]{${length}}`).join("-")}$`, "i");

export function isUuid(uuid: string): boolean {
	return UUID_PATTERN.test(uuid);
}

/* Prisma의 Bytes는 Buffer가 아니라 Uint8Array다. Buffer로 주고받으면 Node 타입
   정의에 따라 ArrayBufferLike/ArrayBuffer 불일치가 나므로 처음부터 맞춰 둔다. */
export function uuidToBin(uuid: string): Uint8Array<ArrayBuffer> {
	const hex: string = uuid.replaceAll("-", "");

	if (!UUID_HEX_PATTERN.test(hex)) {
		throw new Error(`UUID 형식이 올바르지 않습니다: ${uuid}`);
	}

	const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(UUID_BYTE_LENGTH);

	for (let index = 0; index < UUID_BYTE_LENGTH; index += 1) {
		bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
	}

	return bytes;
}

export function binToUuid(bytes: Uint8Array): string {
	if (bytes.length !== UUID_BYTE_LENGTH) {
		throw new Error(`UUID는 ${UUID_BYTE_LENGTH}바이트여야 합니다: ${bytes.length}바이트`);
	}

	const hex: string = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

	let offset: number = 0;

	return UUID_SEGMENTS.map((length) => {
		const segment: string = hex.slice(offset, offset + length);

		offset += length;

		return segment;
	}).join("-");
}
