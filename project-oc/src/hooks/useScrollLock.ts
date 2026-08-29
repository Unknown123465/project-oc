import {useEffect} from "react";

export function useScrollLock(locked: boolean) {
	useEffect(() => {
		if (locked) {
			const scrollY: number = window.scrollY;
			const {body} = document;

			body.style.position = "fixed";
			body.style.top = `-${scrollY}px`;
			body.style.left = "0";
			body.style.right = "0";

			return () => {
				body.style.position = "";
				body.style.top = "";
				body.style.left = "";
				body.style.right = "";
				window.scrollTo(0, scrollY);
			};
		}
	}, [locked]);
}
