import Image from "next/image";
import Link from "next/link";
import styles from "../mylist/MyCharacterTile.module.css";
import BrowseTileMenu from "./BrowseTileMenu";
import {toEncodeParam} from "@/app/edit/[uuid]/toEncodeParam";
import type {BrowseItem, BrowseSort} from "./validator";
import type {ProfileLayout} from "../template/CharacterProfile";

interface BrowseTileProps {
	character: BrowseItem;
	/** 첫 줄 타일만 먼저 불러온다. */
	priority?: boolean;
	nonce: string | null;
	/** 지금 보는 페이지, 검색어, 정렬. 프로필 페이지의 "← 둘러보기"가 이 값으로 돌아온다. */
	page: number;
	keyword: string;
	sort: BrowseSort;
}

/* 타일 모양은 /mylist와 같고, 공개 여부 표시 자리에 한 줄 소개(charMessage)를 둔다. 전부 공개 프로필이라 이미지는 고정 주소다. */
export default function BrowseTile({character, priority = false, nonce, page, keyword, sort}: BrowseTileProps) {
	const {uuid, charName, charImage, charColor, charProfileLayout, likeCount, commentCount, charMessage, kakaoDetail} = character;

	const profileURL: string = `/template/${uuid}?${toEncodeParam("page", page.toString())}${toEncodeParam("keyword", keyword)}${toEncodeParam("sort", sort)}`.replace(/&+$/, "");

	return (
		<article className={styles.tile} style={{"--char-color": charColor}}>
			<Link href={profileURL} className={styles.link}>
				<div className={`${styles.media} ${charProfileLayout === "v" ? styles.vertical : ""}`}>
					<Image src={charImage} alt={`${charName} 캐릭터 이미지`} fill sizes="(width < 768px) 50vw, (width < 1024px) 33vw, 280px" loading={priority ? "eager" : "lazy"} />
				</div>

				<div className={styles.body}>
					<h2>{charName}</h2>

					<div className={`${styles.meta} ${styles.browse}`}>
						<span className={styles.message}>{charMessage}</span>

						<span className={styles.stats}>
							<span aria-label={`좋아요 ${likeCount}개`}>
								<i className="bi bi-heart" aria-hidden="true"></i>
								{likeCount}
							</span>

							<span aria-label={`코멘트 ${commentCount}개`}>
								<i className="bi bi-chat" aria-hidden="true"></i>
								{commentCount}
							</span>
						</span>
					</div>
				</div>
			</Link>

			<BrowseTileMenu uuid={uuid} charName={charName} charMessage={charMessage} kakaoDetail={kakaoDetail} imageSrc={charImage} nonce={nonce} />
		</article>
	);
}
