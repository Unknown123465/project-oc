"use client";

import {useEffect, useState} from "react";

type DataURLStatus = "pending" | "success" | "failure";

export interface UseImageDataURL {
	url: string | null;
	status: DataURLStatus;
	message: string;
}

export function useImageDataURL(url: string) {
	const [dataURL, setDataURL] = useState<string | null>(null);
	const [status, setStatus] = useState<DataURLStatus>("pending");
	const [message, setMessage] = useState<string>("");

	useEffect(() => {
		const abort: AbortController = new AbortController();

		new Promise<string>(async (res, rej) => {
			let blob;

			try {
				const response = await fetch(url, {
					signal: abort.signal,
					cache: "no-store",
				});

				if (!response.ok) {
					rej(new Error("이미지를 불러오지 못했어요. 다시 시도해 주세요."));

					return;
				}

				blob = await response.blob();
			} catch {
				rej(new Error("이미지를 불러오지 못했어요. 다시 시도해 주세요."));

				return;
			}

			const fileReader: FileReader = new FileReader();

			fileReader.onload = () => {
				if (!abort.signal.aborted && typeof fileReader.result === "string") {
					res(fileReader.result);
				} else if (abort.signal.aborted) {
					rej(new Error("이미지를 불러오는 도중 페이지를 벗어났어요."));
				} else {
					rej(new Error("이미지를 불러오지 못했어요. 다시 시도해 주세요."));
				}
			};

			fileReader.onerror = () => {
				rej(new Error("이미지를 불러오지 못했어요. 다시 시도해 주세요."));
			};

			fileReader.readAsDataURL(blob);
		})
			.then((result) => {
				setStatus("success");
				setDataURL(result);
				setMessage("");
			})
			.catch((err: Error) => {
				if (!abort.signal.aborted) {
					setStatus("failure");
					setDataURL(null);
					setMessage(err.message);
				}
			});

		return () => {
			abort.abort();
		};
	}, [url]);

	return {
		url: dataURL,
		status,
		message,
	};
}
