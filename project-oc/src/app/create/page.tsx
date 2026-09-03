import styles from "./page.module.css";
import LivePreview from "../_components/create/LivePreview";
import CreateForm from "../_components/create/CreateForm";
import {zodResolver} from "@hookform/resolvers/zod";
import {createCharForm, CreateCharFormType, CreateCharFormInputType} from "@/app/create/validator";
import {useForm} from "react-hook-form";

export default function Create() {
	const {
		control,
		register,
		handleSubmit,
		setError,
		watch,
		formState: {errors, isSubmitting},
	} = useForm<CreateCharFormInputType, unknown, CreateCharFormType>({
		defaultValues: {
			charName: "",
			charMessage: "",
			charLike: "",
			charHate: "",
			charPersonality: "",
			charTmi: "",
			charKind: "",
			charAge: "",
			charBirthday: "",
			charHeight: "",
			charBirthplace: "",
			charMbti: "",
			charMusic: "",
			charColor: "#d3d3d3",
			aiUsed: "",
			publicMode: "0",
		},
		resolver: zodResolver(createCharForm),
	});

	return (
		<main className={styles.main}>
			<section className={styles.heading}>
				<h1>새 캐릭터 등록</h1>

				<p className={styles.subtitle}>핵심 정보부터 작성하세요. 오른쪽 프로필은 입력하는 즉시 완성됩니다.</p>
			</section>

			<div className={styles.mobile_tabs} role="tablist" aria-label="작성 화면 전환">
				<button type="button" role="tab" aria-selected="true">
					작성
				</button>

				<button type="button" role="tab" aria-selected="false">
					미리보기
				</button>
			</div>

			<div className={styles.layout}>
				<CreateForm control={control} register={register} handleSubmit={handleSubmit} setError={setError} errors={errors} isSubmitting={isSubmitting} />

				<LivePreview watch={watch} />
			</div>
		</main>
	);
}
