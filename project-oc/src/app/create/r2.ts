import {CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, S3Client, type HeadObjectCommandOutput} from "@aws-sdk/client-s3";
import {r2Endpoint} from "./r2Endpoint";

/* 공개(0)는 커스텀 도메인으로 누구나 읽을 수 있는 버킷에, 일부 공개(1)와
   비공개(2)는 서명된 URL로만 열리는 버킷에 넣는다. 버킷을 물리적으로 나눠 두면
   공개 설정을 잘못 만져도 비공개 이미지가 링크만으로 새어 나가지 않는다. */
export const PUBLIC_MODE_PUBLIC: number = 0;

/* 일부공개(1)는 링크를 아는 사람이면 누구나 열 수 있고, 비공개(2)만 올린 사람에게
   묶인다. 두 값이 같은 프라이빗 버킷을 쓰기 때문에 저장 위치만으로는 갈리지 않고,
   읽는 쪽에서 이 값을 보고 주인을 확인해야 실제로 구분된다. */
export const PUBLIC_MODE_PRIVATE: number = 2;

function readEnv(name: string): string {
	const value: string | undefined = process.env[name];

	if (!value) {
		throw new Error(`환경 변수 ${name}이(가) 비어 있습니다.`);
	}

	return value;
}

/* 모듈을 읽는 시점에 만들면 환경 변수가 없는 빌드 단계에서 next build가 죽는다.
   실제로 R2를 쓰는 첫 호출까지 미룬다. */
let client: S3Client | null = null;

export function r2(): S3Client {
	if (client === null) {
		const endpoint: string = r2Endpoint();

		if (!endpoint) {
			throw new Error("환경 변수 R2_ACCOUNT_ID가 비어 있습니다.");
		}

		client = new S3Client({
			/* R2에는 리전 개념이 없어 auto로 고정한다. */
			region: "auto",
			endpoint,
			/* 기본값인 가상 호스트 방식은 버킷 이름이 호스트 앞에 붙어 버킷마다 주소가
			   달라진다. 경로 방식으로 고정해야 CSP connect-src에 와일드카드 없이
			   호스트 한 줄만 적을 수 있다. */
			forcePathStyle: true,
			credentials: {
				accessKeyId: readEnv("R2_ACCESS_KEY_ID"),
				secretAccessKey: readEnv("R2_SECRET_ACCESS_KEY"),
			},
		});
	}

	return client;
}

export function charImageBucket(publicMode: number): string {
	return publicMode === PUBLIC_MODE_PUBLIC ? readEnv("R2_PUBLIC_BUCKET") : readEnv("R2_PRIVATE_BUCKET");
}

/* 공개 버킷은 커스텀 도메인이 붙어 있어 서명 없이 이 주소로 바로 열린다.
   readEnv를 거치는 이유는, 주소를 문자열로 이어 붙이는 자리라 환경 변수가 비어도
   "undefined/characters/..."라는 그럴듯한 주소가 조용히 만들어지기 때문이다. */
export function publicCharImageURL(key: string): string {
	return `${readEnv("R2_PUBLIC_URL")}/${key}`;
}

/* 키 앞에 업로더 id를 두어야 서명 URL을 받은 사람이 남의 오브젝트를 가리킬 수 없다.
   Character 행이 charUploaderId와 charImage를 모두 들고 있으므로 프로필을 읽을 때
   이 키를 그대로 다시 만들 수 있다. */
export function charImageKey(userId: string, imageName: string): string {
	return `characters/${userId}/${imageName}`;
}

/* 브라우저는 항상 이 임시 경로로 올리고, 등록이 끝난 것만 위의 최종 경로로 옮긴다.
   업로드 직후 사용자가 창을 닫아 등록까지 오지 못한 오브젝트는 여기 남는데,
   버킷의 수명 주기 규칙이 tmp/ 접두어를 하루 뒤 지우므로 쌓이지 않는다.
   최종 경로에는 Character 행이 가리키는 이미지만 존재하게 된다. */
export function charImageTempKey(userId: string, imageName: string): string {
	return `tmp/${userId}/${imageName}`;
}

export async function headCharImage(bucket: string, key: string): Promise<HeadObjectCommandOutput> {
	return await r2().send(new HeadObjectCommand({Bucket: bucket, Key: key}));
}

/* 같은 버킷 안에서 옮기므로 이미지가 다시 오갈 일은 없다. Content-Type을 비롯한
   메타데이터는 기본 동작대로 원본에서 그대로 따라온다. */
export async function copyCharImage(bucket: string, sourceKey: string, key: string): Promise<void> {
	await r2().send(
		new CopyObjectCommand({
			Bucket: bucket,
			/* CopySource는 버킷 이름까지 포함한 경로이고, 경로 조각은 인코딩해서 넘긴다. */
			CopySource: `${bucket}/${sourceKey}`
				.split("/")
				.map((piece) => encodeURIComponent(piece))
				.join("/"),
			Key: key,
		}),
	);
}

/* 정리에 실패했다고 사용자에게 보여줄 것은 없다. 원래 오류를 덮지 않도록 삼키되,
   남은 오브젝트는 그대로 요금이 나가므로 로그로는 남긴다. */
export async function removeCharImage(bucket: string, key: string): Promise<void> {
	try {
		await r2().send(new DeleteObjectCommand({Bucket: bucket, Key: key}));
	} catch (err) {
		console.error("R2 이미지 정리 실패", {bucket, key, err});
	}
}
