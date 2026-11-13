import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {charImageBucket, charImageKey, publicCharImageURL, r2, PUBLIC_MODE_PUBLIC} from "@/app/create/r2";

/* 이 서명은 캐시에 들어가니 너무 짧게 잡지 말아야 하고, 브라우저 메모리/디스크 캐시에 오래 저장되어
   비공개로 바꾸거나 삭제한 뒤에도 브라우저에 이미지가 남지 않을 정도의 시간으로 잡으면 된다.
   브라우저가 페이지를 받은 뒤 이미지를 실제로 받아 가고 한두 번 새로고침해도 남을 만큼만 있으면 된다. */
const SIGNING_SECOND = 300 as const;

/* 서명 구간이 끝난 뒤에도 서명 주소를 쓸 수 있게 추가 시간을 부여한다. */
const CHAR_IMAGE_URL_MAX_AGE = 600 as const;

/* 일부공개(1), 비공개(2) 캐릭터의 이미지는 서명 없이는 열리지 않는 프라이빗 버킷에 있다.
   프로필 둘러보기 등, 검색 및 필터로 인해 같은 이미지를 매번 불러와서 Class B 횟수가 쌓이는걸 막기위해 signingDate를 적용한다. */
export async function presignedCharImageURL(bucket: string, key: string): Promise<string> {
	const signingMillSecond: number = SIGNING_SECOND * 1000;
	const signingDate: Date = new Date(Math.floor(Date.now() / signingMillSecond) * signingMillSecond);

	const result: string = await getSignedUrl(
		r2(),
		new GetObjectCommand({
			Bucket: bucket,
			Key: key,
			ResponseCacheControl: `private, max-age=${SIGNING_SECOND}`,
		}),
		{
			signingDate,
			expiresIn: SIGNING_SECOND + CHAR_IMAGE_URL_MAX_AGE,
		}
	);

	return result;
}

/* 공개 여부에 따라 고정 주소와 서명 주소로 갈린다. 갈림길을 여기 한 곳에 두어야
   부르는 쪽이 공개 모드 숫자를 다시 해석하지 않는다. */
export async function charImageURL(publicMode: number, uploaderId: string, imageName: string): Promise<string> {
	const key: string = charImageKey(uploaderId, imageName);

	if (publicMode === PUBLIC_MODE_PUBLIC) {
		return publicCharImageURL(key);
	}

	return await presignedCharImageURL(charImageBucket(publicMode), key);
}
