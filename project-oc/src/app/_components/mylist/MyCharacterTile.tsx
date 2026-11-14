import Image from "next/image";
import Link from "next/link";
import styles from "./MyCharacterTile.module.css";
import TileMenu from "./TileMenu";
import {PUBLIC_MODE_PRIVATE, PUBLIC_MODE_PUBLIC} from "@/app/create/r2";
import type {MyListItem} from "./validator";

const PUBLIC_MODE_LABEL: Readonly<Record<number, string>> = {
	0: "공개",
	1: "일부 공개",
	2: "비공개",
};

interface MyCharacterTileProps {
	character: MyListItem;
	/** 첫 줄 타일만 먼저 불러온다. */
	priority?: boolean;
	nonce: string | null;
	params: Record<string, string | string[] | undefined>;
}

export default function MyCharacterTile({character, priority = false, nonce, params}: MyCharacterTileProps) {
	const {uuid, charName, charImage, charColor, charPublicMode, likeCount, commentCount, charMessage, kakaoDetail} = character;

	const isPublic: boolean = charPublicMode === PUBLIC_MODE_PUBLIC;
	const shareable: boolean = charPublicMode !== PUBLIC_MODE_PRIVATE;

	return (
		<article className={styles.tile} style={{"--char-color": charColor}}>
			<Link href={`/template/${uuid}`} className={styles.link}>
				<div className={styles.media}>
					<Image
						src={charImage}
						alt={`${charName} 캐릭터 이미지`}
						fill
						sizes="(width < 768px) 50vw, (width < 1024px) 33vw, 280px"
						loading={priority ? "eager" : "lazy"}
						unoptimized={!isPublic}
					/>
				</div>

				<div className={styles.body}>
					<h2>{charName}</h2>

					<div className={styles.meta}>
						<span className={`${styles.visibility} ${isPublic ? styles.public : ""}`}>{PUBLIC_MODE_LABEL[charPublicMode]}</span>

						<span className={styles.stats}>
							{shareable ? (
								<>
									<span aria-label={`좋아요 ${likeCount}개`}>
										<i className="bi bi-heart" aria-hidden="true"></i>
										{likeCount}
									</span>

									<span aria-label={`코멘트 ${commentCount}개`}>
										<i className="bi bi-chat" aria-hidden="true"></i>
										{commentCount}
									</span>
								</>
							) : null}
						</span>
					</div>
				</div>
			</Link>

			<TileMenu
				uuid={uuid}
				charName={charName}
				charMessage={charMessage}
				kakaoDetail={kakaoDetail}
				imageSrc={charImage}
				isPublic={isPublic}
				shareable={shareable}
				nonce={nonce}
				params={params}
			/>
		</article>
	);
}
