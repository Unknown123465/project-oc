/* R2의 S3 엔드포인트 주소는 업로드를 실행하는 서버 액션뿐 아니라 CSP를 만드는
   proxy에서도 필요하다. proxy가 r2.ts를 가져오면 @aws-sdk/client-s3까지 미들웨어
   번들에 끌려 들어가므로, SDK를 건드리지 않는 주소 계산만 여기로 떼어 둔다. */
export function r2Endpoint(): string {
	const accountId: string | undefined = process.env.R2_ACCOUNT_ID;

	return accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "";
}
