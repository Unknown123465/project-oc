"use client";

import styles from "./CreateWorkspace.module.css";
import CreateForm from "./CreateForm";
import LivePreview from "./LivePreview";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {createCharForm, CreateCharFormType, CreateCharFormInputType} from "@/app/create/validator";

/* CreateForm(입력)과 LivePreview(실시간 미리보기)가 같은 form 인스턴스를 봐야 해서
   두 컴포넌트의 공통 조상인 이곳에서 useForm을 만든다. page.tsx에 두면 페이지가
   클라이언트 컴포넌트가 되어 로그인 가드용 await auth()와 metadata를 쓸 수 없다. */
export default function CreateWorkspace() {
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
		<div className={styles.layout}>
			<CreateForm control={control} register={register} handleSubmit={handleSubmit} setError={setError} errors={errors} isSubmitting={isSubmitting} />

			<LivePreview watch={watch} />
		</div>
	);
}
