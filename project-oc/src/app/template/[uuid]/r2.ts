import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {charImageBucket, charImageKey, publicCharImageURL, r2, PUBLIC_MODE_PUBLIC} from "@/app/create/r2";

/* 이 서명은 캐시에 들어가지 않고 요청마다 새로 만들어진다(getCharacter.ts 참고).
   그래서 수명은 "캐시가 얼마나 오래 들고 있나"와 무관하고, 브라우저가 페이지를 받은
   뒤 이미지를 실제로 받아 가고 한두 번 새로고침해도 남을 만큼만 있으면 된다. */
const CHAR_IMAGE_URL_MAX_AGE: number = 600;

/* 일부공개(1)·비공개(2) 캐릭터의 이미지는 서명 없이는 열리지 않는 프라이빗 버킷에 있다.
   서명은 만들어진 순간부터 시간이 흐르므로, 결과를 저장해 두고 재사용하면 안 된다. */
export async function presignedCharImageURL(bucket: string, key: string): Promise<string> {
	return await getSignedUrl(r2(), new GetObjectCommand({Bucket: bucket, Key: key}), {expiresIn: CHAR_IMAGE_URL_MAX_AGE});
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
