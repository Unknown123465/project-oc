import {blankRegex} from "@/app/create/validator";
import {isUuid} from "@/prisma/uuid";
import z from "zod";

export const COMMENT_MAX_LENGTH = {
	normal: 300,
	beforeErase: 1000,
} as const;

export const EMPTY_COMMENT_MESSAGE = "코멘트를 입력해 주세요." as const;

export const WRONG_UUID_MESSAGE = "프로필 주소가 올바르지 않아요." as const;

export const MAX_LENGTH_MESSAGE = {
	normal: `${COMMENT_MAX_LENGTH.normal}자 이하로 입력해 주세요.`,
	beforeErase: `${COMMENT_MAX_LENGTH.beforeErase}자 이하로 입력해 주세요.`,
} as const;

export const WRONG_COMMENT_ID_MESSAGE = "유효한 코멘트가 아니에요." as const;

export const writeCommentForm = z.object({
	uuid: z.string(WRONG_UUID_MESSAGE).refine((value) => isUuid(value), WRONG_UUID_MESSAGE),
	comment: z
		.string(EMPTY_COMMENT_MESSAGE)
		.max(COMMENT_MAX_LENGTH.beforeErase, `${COMMENT_MAX_LENGTH.beforeErase}자 이하로 입력해 주세요.`)
		.transform((value) => value.replaceAll(blankRegex, ""))
		.pipe(z.string().min(1, EMPTY_COMMENT_MESSAGE).max(COMMENT_MAX_LENGTH.normal, `${COMMENT_MAX_LENGTH.normal}자 이하로 입력해 주세요.`)),
});

export type WriteCommentFormType = z.input<typeof writeCommentForm>;
export const editCommentForm = z.object(
	{
		uuid: writeCommentForm.shape.uuid,
		commentId: z
			.union([z.bigint().positive(WRONG_COMMENT_ID_MESSAGE), z.string().regex(/^[1-9]\d*$/, WRONG_COMMENT_ID_MESSAGE)], WRONG_COMMENT_ID_MESSAGE)
			.pipe(z.coerce.bigint(WRONG_COMMENT_ID_MESSAGE)),
		comment: writeCommentForm.shape.comment,
	},
	"형식이 올바르지 않아요."
);

export const commentForm = z.object({
	comment: editCommentForm.shape.comment,
});

export type CommentFormType = z.infer<typeof commentForm>;

export type EditCommentFormInputType = z.input<typeof editCommentForm>;

export const deleteOrHiddenCommentForm = editCommentForm.omit({
	comment: true,
});

export type DeleteOrHiddenCommentFormType = z.input<typeof deleteOrHiddenCommentForm>;
