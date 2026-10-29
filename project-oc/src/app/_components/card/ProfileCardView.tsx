"use client";

import ProfileCard from "./ProfileCard";
import ProfileCardFooter from "./ProfileCardFooter";
import type {CardCharacter} from "./cardCharacter";
import type {ProfileLikeView} from "../template/ProfileLike";
import {useImageDataURL} from "@/hooks/useImageDataURL";
import {useState} from "react";

interface ProfileCardViewProps {
	uuid: string;
	/** 비공개 프로필은 좋아요와 링크 복사를 그리지 않는다. */
	shareable: boolean;
	like: ProfileLikeView | null;
	character: CardCharacter;
}

/** 화면 카드와 아래 버튼 줄을 묶는다. 이미지 data: URL 훅을 한 곳에서 부르기 위한 클라이언트 경계다. */
export default function ProfileCardView({uuid, shareable, like, character}: ProfileCardViewProps) {
	const [charImage] = useState<string>(character.charImage);

	const imageDataURL = useImageDataURL(charImage);

	return (
		<>
			<ProfileCard character={character} imageDataURL={imageDataURL} />

			<ProfileCardFooter uuid={uuid} shareable={shareable} like={like} character={character} imageDataURL={imageDataURL} />
		</>
	);
}
