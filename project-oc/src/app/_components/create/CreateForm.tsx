"use client";

import sectionStyles from "./Section.module.css";
import styles from "./CreateForm.module.css";
import ImageUploadField from "./ImageUploadField";
import CoreInfoSection from "./CoreInfoSection";
import ColorSection from "./ColorSection";
import ChoiceSection from "./ChoiceSection";
import {SubmitButton, LinkButton} from "@/components/ui/button";
import type {Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormSetError, UseFormSetValue, UseFormSetValues} from "react-hook-form";
import {createCharForm, editCharForm, EditCharFormType, type CreateCharFormInputType} from "@/app/create/validator";
import {useId, useTransition} from "react";
import {unstable_rethrow, useParams, useSearchParams} from "next/navigation";
import {createCharAction, editCharAction} from "@/app/create/action";
import {createUploadURLAction, editUploadURLAction} from "@/app/create/uploadAction";
import {IMAGE_UPLOAD_TYPE} from "@/app/create/imageEditor";

interface CreateFormProps {
	control: Control<CreateCharFormInputType>;
	register: UseFormRegister<CreateCharFormInputType>;
	handleSubmit: UseFormHandleSubmit<CreateCharFormInputType>;
	setError: UseFormSetError<CreateCharFormInputType>;
	setValue: UseFormSetValue<CreateCharFormInputType>;
	setValues: UseFormSetValues<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
	isSubmitting: boolean;
	/** 오늘 남은 AI 초안 횟수. ImageUploadField를 거쳐 초안 모달이 쓴다. */
	aiDraftRemaining: number;
	aiDraftEnabled: boolean;
	editable: boolean;
	backURL?: string;
}

export default function CreateForm({control, register, handleSubmit, setError, setValue, setValues, errors, isSubmitting, aiDraftRemaining, aiDraftEnabled, editable, backURL = "/"}: CreateFormProps) {
	const param = useParams();
	const query = useSearchParams();

	const [isPending, startTransition] = useTransition();

	const aiHeadingId = useId();
	const visibilityHeadingId = useId();

	const createSubmit = async (data: unknown) => {
		const check = createCharForm.safeParse(data);

		if (!check.success) {
			setError("root", {
				message: check.error.issues[0].message,
			});

			return;
		}

		const {charImage, ...charData} = check.data;

		/* refine이 Blob임을 보장하지만 nullable이 붙어 있어 타입은 좁혀지지 않는다. */
		if (charImage === null) {
			setError("root", {
				message: "캐릭터 이미지를 업로드해 주세요.",
			});

			return;
		}

		/* 이미지는 서버를 거치지 않고 브라우저에서 R2로 곧장 올린다. 서버 액션 본문
		   제한(1MB)과 Vercel 요청 본문 제한(4.5MB)에 걸리지 않게 하기 위함이고,
		   서버 액션에는 업로드 결과 파일 이름만 넘어간다. */
		const issued = await createUploadURLAction({publicMode: charData.publicMode, size: charImage.size});

		if (!issued.success) {
			setError("root", {
				message: issued.message,
			});

			return;
		}

		try {
			const uploaded: Response = await fetch(issued.uploadURL, {
				method: "PUT",
				body: charImage,
				/* 서명에 박힌 값과 어긋나면 R2가 거부하므로 그대로 맞춰 보낸다. */
				headers: {
					"Content-Type": IMAGE_UPLOAD_TYPE,
				},
			});

			if (!uploaded.ok) {
				throw new Error();
			}
		} catch {
			setError("root", {
				message: "이미지를 올리지 못했어요. 잠시 후 다시 시도해 주세요.",
			});

			return;
		}

		startTransition(async () => {
			try {
				/* 이 시점부터 R2에는 파일이 올라가 있다. 등록이 실패하면 서버 액션이 그
		   		파일을 지우고 돌아오므로 여기서 따로 정리하지 않는다. */
				const result = await createCharAction({...charData, charImageName: issued.imageName});

				if (!result.success) {
					setError("root", {
						message: result.message,
					});
				}
			} catch (err) {
				unstable_rethrow(err);

				setError("root", {
					message: "등록하지 못했어요. 잠시 후 다시 시도해 주세요.",
				});
			}
		});
	};

	const editSubmit = async (data: unknown, uuid: string) => {
		const check = editCharForm.safeParse(data);

		if (!check.success) {
			setError("root", {
				message: check.error.issues[0].message,
			});

			return;
		}

		const {charImage, ...charData} = check.data;

		let imageName: string | null = null;

		if (charImage !== null) {
			const issued = await editUploadURLAction({
				uuid,
				publicMode: charData.publicMode,
				size: charImage.size,
			});

			if (!issued.success) {
				setError("root", {
					message: issued.message,
				});

				return;
			}

			try {
				const uploaded: Response = await fetch(issued.uploadURL, {
					method: "PUT",
					body: charImage,
					headers: {
						"Content-Type": IMAGE_UPLOAD_TYPE,
					},
				});

				if (!uploaded.ok) {
					throw new Error();
				}

				imageName = issued.imageName;
			} catch {
				setError("root", {
					message: "이미지를 올리지 못했어요. 잠시 후 다시 시도해 주세요.",
				});

				return;
			}
		}

		let link: string | null = query.get("link");

		link = link === "profile" || link === "mylist" ? link : "profile";

		startTransition(async () => {
			try {
				const result = await editCharAction({...charData, charImageName: imageName, uuid}, link === "mylist" ? backURL : `/template/${uuid}`);

				if (!result.success) {
					setError("root", {
						message: result.message,
					});
				}
			} catch (err) {
				unstable_rethrow(err);

				setError("root", {
					message: "수정하지 못했어요. 잠시 후 다시 시도해 주세요.",
				});
			}
		});
	};

	const onSubmit = async (data: CreateCharFormInputType | EditCharFormType) => {
		if (!editable) {
			await createSubmit(data);
		} else if (editable && typeof param.uuid === "string") {
			await editSubmit(data, param.uuid);
		} else {
			setError("root", {
				message: "수정할 원본 프로필을 찾지 못했어요. 다시 시도해 주세요.",
			});
		}
	};

	let submitButtonMessage: string = "";

	if (!editable) {
		submitButtonMessage = isSubmitting || isPending ? "제출 중" : "프로필 완성";
	} else {
		submitButtonMessage = isSubmitting || isPending ? "수정 중" : "프로필 수정";
	}

	return (
		<form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
			<ImageUploadField control={control} errors={errors} setValue={setValue} setValues={setValues} aiDraftRemaining={aiDraftRemaining} aiDraftEnabled={aiDraftEnabled} />

			<CoreInfoSection control={control} errors={errors} />

			<ColorSection control={control} errors={errors} />

			<ChoiceSection
				headingId={aiHeadingId}
				heading="프로필 이미지에 AI를 사용했나요?"
				required
				warning="AI를 썼는데 안 썼다고 답하면 프로필이 삭제될 수 있어요."
				name="aiUsed"
				register={register}
				errors={errors}
				choices={[
					{value: "1", title: "네, AI를 사용했습니다"},
					{value: "0", title: "아니오, AI를 사용하지 않았습니다"},
				]}
			/>

			<ChoiceSection
				headingId={visibilityHeadingId}
				heading="공개 여부"
				name="publicMode"
				register={register}
				errors={errors}
				choices={[
					{value: "0", title: "공개", description: "검색과 링크로 누구나 볼 수 있어요."},
					{value: "1", title: "일부 공개", description: "링크를 아는 사람만 볼 수 있어요."},
					{value: "2", title: "비공개", description: "나만 볼 수 있어요."},
				]}
			/>

			<div className={styles.root_error}>
				<p className={sectionStyles.error_message}>{errors.root?.message}</p>
			</div>

			<div className={styles.actions}>
				<SubmitButton styleType="attention" disabled={isSubmitting || isPending} style={{flex: 1}}>
					{submitButtonMessage}
				</SubmitButton>

				{editable ? (
					<LinkButton href={backURL} styleType="simple" style={{flex: 1}}>
						취소
					</LinkButton>
				) : null}
			</div>
		</form>
	);
}
