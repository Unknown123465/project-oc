"use client";

import {type FieldPathByValue, type FieldValues, useWatch, type Control} from "react-hook-form";

export function useFormValueLength<T extends FieldValues, K extends FieldPathByValue<T, string | unknown[]>>(control: Control<T>, name: K): number {
	const length = useWatch({
		name,
		control,
		compute(value) {
			return value.length;
		},
	});

	return length;
}
