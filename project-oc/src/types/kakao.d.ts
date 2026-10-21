/* 카카오 JavaScript SDK(2.8.4)는 npm 패키지가 없고 CDN 스크립트로만 실려서 타입이 없다.
   쓰는 부분(초기화, 피드 템플릿 공유)만 공식 레퍼런스대로 옮겼다.
   https://developers.kakao.com/sdk/reference/js/release/Kakao.html
   https://developers.kakao.com/sdk/reference/js/release/Kakao.Share.html */

interface KakaoLinkObject {
	webUrl?: string;
	mobileWebUrl?: string;
	androidExecutionParams?: string;
	iosExecutionParams?: string;
}

interface KakaoContentObject {
	title: string;
	imageUrl: string;
	link: KakaoLinkObject;
	imageWidth?: number;
	imageHeight?: number;
	description?: string;
}

interface KakaoItemObject {
	item: string;
	itemOp: string;
}

interface KakaoItemContentObject {
	profileText?: string;
	profileImageUrl?: string;
	titleImageText?: string;
	titleImageUrl?: string;
	titleImageCategory?: string;
	/** 최대 5개 */
	items?: KakaoItemObject[];
	sum?: string;
	sumOp?: string;
}

interface KakaoSocialObject {
	likeCount?: number;
	commentCount?: number;
	sharedCount?: number;
	viewCount?: number;
	subscriberCount?: number;
}

interface KakaoButtonObject {
	title: string;
	link: KakaoLinkObject;
}

interface KakaoDefaultFeedSettings {
	objectType: "feed";
	content: KakaoContentObject;
	itemContent?: KakaoItemContentObject;
	social?: KakaoSocialObject;
	buttonTitle?: string;
	buttons?: KakaoButtonObject[];
	/** 기본값 false */
	installTalk?: boolean;
	serverCallbackArgs?: Record<string, unknown> | string;
}

interface KakaoShare {
	/* 레퍼런스는 피드 말고도 리스트·위치·커머스·텍스트·캘린더 템플릿을 받지만 피드만 쓴다. */
	sendDefault(settings: KakaoDefaultFeedSettings): void;
}

interface KakaoStatic {
	readonly VERSION: string;
	/** 앱 키가 틀리면 KakaoError를 던진다. */
	init(appKey: string): void;
	isInitialized(): boolean;
	cleanup(): void;
	Share: KakaoShare;
}

interface Window {
	/* 스크립트가 막히거나 아직 안 실렸으면 없다. 선택 속성으로 둬서 쓰기 전에 확인하게 한다. */
	Kakao?: KakaoStatic;
}
