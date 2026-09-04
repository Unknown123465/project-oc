"use client";

import styles from "./CreateWorkspace.module.css";
import CreateForm from "./CreateForm";
import LivePreview from "./LivePreview";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {createCharForm, CreateCharFormType, CreateCharFormInputType} from "@/app/create/validator";
import {useState, useSyncExternalStore} from "react";

type MobileTab = "create" | "preview";

/* CreateWorkspace.module.css의 .mobile_tabs를 숨기는 분기점과 같은 값이어야 한다. */
const MOBILE_QUERY = "(width < 876px)";

/* 뷰포트 폭은 React 밖에 있는 브라우저 상태라 useSyncExternalStore로 구독한다.
   effect 안에서 setState로 맞추면 첫 렌더가 한 번 버려지고, 저장소 lint 규칙
   react-hooks/set-state-in-effect에도 걸린다. */
function subscribeMobile(onStoreChange: () => void) {
	const mediaQuery: MediaQueryList = window.matchMedia(MOBILE_QUERY);

	mediaQuery.addEventListener("change", onStoreChange);

	return () => {
		mediaQuery.removeEventListener("change", onStoreChange);
	};
}

function getMobileSnapshot(): boolean {
	return window.matchMedia(MOBILE_QUERY).matches;
}

/* 서버에는 뷰포트가 없다. 데스크톱으로 그려 두면 하이드레이션 직후 실제 폭으로 정정된다. */
function getMobileServerSnapshot(): boolean {
	return false;
}

/* CreateForm(입력)과 LivePreview(실시간 미리보기)가 같은 form 인스턴스를 봐야 해서
   두 컴포넌트의 공통 조상인 이곳에서 useForm을 만든다. page.tsx에 두면 페이지가
   클라이언트 컴포넌트가 되어 로그인 가드용 await auth()와 metadata를 쓸 수 없다. */
export default function CreateWorkspace() {
	const {
		control,
		register,
		handleSubmit,
		setError,
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

	const isMobile: boolean = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);

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
					<CreateForm control={control} register={register} handleSubmit={handleSubmit} setError={setError} errors={errors} isSubmitting={isSubmitting} />
				) : null}

				{showPreview ? <LivePreview control={control} /> : null}
			</div>
		</>
	);
}
