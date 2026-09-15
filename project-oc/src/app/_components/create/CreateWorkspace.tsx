"use client";

import styles from "./CreateWorkspace.module.css";
import CreateForm from "./CreateForm";
import LivePreview from "./LivePreview";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {createCharForm, CreateCharFormType, CreateCharFormInputType} from "@/app/create/validator";
import {useState} from "react";
import {useMediaQuery} from "@/hooks/useMediaQuery";

type MobileTab = "create" | "preview";

/* CreateWorkspace.module.css의 .mobile_tabs를 숨기는 분기점과 같은 값이어야 한다. */
const MOBILE_QUERY = "(width < 876px)";

/* CreateForm(입력)과 LivePreview(실시간 미리보기)가 같은 form 인스턴스를 봐야 해서
   두 컴포넌트의 공통 조상인 이곳에서 useForm을 만든다. page.tsx에 두면 페이지가
   클라이언트 컴포넌트가 되어 로그인 가드용 await auth()와 metadata를 쓸 수 없다. */
interface CreateWorkspaceProps {
	/** 서버가 알려준 오늘 남은 AI 초안 횟수. 초안 모달까지 그대로 내려간다. */
	aiDraftRemaining: number;
}

export default function CreateWorkspace({aiDraftRemaining}: CreateWorkspaceProps) {
	const {
		control,
		register,
		handleSubmit,
		setError,
		setValue,
		setValues,
		formState: {errors, isSubmitting},
	} = useForm<CreateCharFormInputType, unknown, CreateCharFormType>({
		defaultValues: {
			charName: "",
			charImage: null,
			charProfileLayout: "",
			charImageFrame: "",
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
		mode: "onChange",
	});

	const isMobile: boolean = useMediaQuery(MOBILE_QUERY);

	const [mobileTab, setMobileTab] = useState<MobileTab>("create");

	/* 데스크톱은 탭 없이 둘 다 보여 준다. 모바일에서만 탭이 고른 쪽만 남긴다. */
	const showForm: boolean = !isMobile || mobileTab === "create";
	const showPreview: boolean = !isMobile || mobileTab === "preview";

	return (
		<>
			<div className={styles.mobile_tabs} role="tablist" aria-label="작성 화면 전환">
				<button type="button" role="tab" aria-selected={mobileTab === "create"} onClick={() => setMobileTab("create")}>
					작성
				</button>

				<button type="button" role="tab" aria-selected={mobileTab === "preview"} onClick={() => setMobileTab("preview")}>
					미리보기
				</button>
			</div>

			<div className={styles.layout}>
				{showForm ? (
					<CreateForm
						control={control}
						register={register}
						handleSubmit={handleSubmit}
						setError={setError}
						setValue={setValue}
						setValues={setValues}
						errors={errors}
						isSubmitting={isSubmitting}
						aiDraftRemaining={aiDraftRemaining}
					/>
				) : null}

				{showPreview ? <LivePreview control={control} /> : null}
			</div>
		</>
	);
}
