import styles from "./ProfileSheet.module.css";
import ProfileFacts from "./ProfileFacts";
import ProfileBlocks from "./ProfileBlocks";
import {useWatch, type Control} from "react-hook-form";
import {CreateCharFormInputType} from "@/app/create/validator";
import {useEffect, useMemo} from "react";

export type ProfileLayout = CreateCharFormInputType["charProfileLayout"];

interface ProfileSheetProps {
	control: Control<CreateCharFormInputType>;
}

const LAYOUT_CLASS: Record<ProfileLayout, string> = {
	"": "",
	h: styles.horizontal,
	v: styles.vertical,
	s: styles.square,
};

export default function ProfileSheet({control}: ProfileSheetProps) {
	const name = useWatch({
		name: "charName",
		control,
		compute(data) {
			return data || "캐릭터 이름";
		},
	});
	const message = useWatch({
		name: "charMessage",
		control,
		compute(data) {
			return data || "이 캐릭터를 한 문장으로 소개해 주세요.";
		},
	});
	const image = useWatch({
		name: "charImage",
		control,
	});
	const color = useWatch({
		name: "charColor",
		control,
	});
	const layout = useWatch({
		name: "charProfileLayout",
		control,
	});

	/* useWatch의 compute는 감시 중인 값이 바뀔 때마다 도는 자리라, 거기서
	   createObjectURL을 부르면 같은 이미지에 URL이 계속 새로 생긴다.
	   Blob 자체를 의존성으로 삼아 이미지 하나당 URL 하나만 만들고,
	   그 URL의 해제를 아래 effect가 짝지어 책임진다. */
	const imageURL = useMemo(() => {
		return image instanceof Blob ? URL.createObjectURL(image) : null;
	}, [image]);

	useEffect(() => {
		if (imageURL !== null) {
			return () => {
				URL.revokeObjectURL(imageURL);
			};
		}
	}, [imageURL]);

	return (
		<article className={`${styles.sheet} ${LAYOUT_CLASS[layout]}`}>
			<div className={styles.hero_grid}>
				<div className={`${styles.cover} ${LAYOUT_CLASS[layout]}`} style={{"--char-color": color}}>
					{imageURL !== null ? <img src={imageURL} alt="캐릭터 프로필 이미지" className={styles.cover_image} /> : null}
				</div>

				<div className={styles.inner}>
					<div className={styles.identity}>
						<h2>{name}</h2>

						<p>{message}</p>
					</div>

					<ProfileFacts control={control} />

					<ProfileBlocks control={control} />
				</div>
			</div>
		</article>
	);
}
