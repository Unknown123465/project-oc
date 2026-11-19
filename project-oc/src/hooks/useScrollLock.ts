import {useEffect} from "react";

export function useScrollLock(locked: boolean) {
	useEffect(() => {
		if (locked) {
			const scrollX: number = window.scrollX;
			const scrollY: number = window.scrollY;
			const {body} = document;

			body.style.position = "fixed";
			body.style.top = `-${scrollY}px`;
			body.style.left = `-${scrollX}px`;
			body.style.right = `${scrollX}px`;

			return () => {
				body.style.position = "";
				body.style.top = "";
				body.style.left = "";
				body.style.right = "";

				window.scrollTo({
					top: scrollY,
					left: scrollX,
					behavior: "instant",
				});
			};
		}
	}, [locked]);
}
