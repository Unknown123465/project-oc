import type {ReactNode} from "react";
import styles from "./ErrorScreen.module.css";

type ErrorVisual = "page" | "server" | "profileLogin" | "profileLocked" | "profileMissing" | "profileServer";

interface ErrorScreenProps {
	title: string;
	description: string;
	actions: ReactNode;
	visual: ErrorVisual;
}

interface VisualIconProps {
	visual: ErrorVisual;
}

function Icon({visual}: VisualIconProps) {
	switch (visual) {
		case "profileLogin":
			return <i className="bi bi-box-arrow-in-right" />;

		case "profileLocked":
			return <i className="bi bi-lock" />;

		case "profileMissing":
			return <i className="bi bi-question-circle" />;

		case "profileServer":
			return <i className="bi bi-exclamation-diamond"></i>;

		default:
			return null;
	}
}

function Visual({visual}: VisualIconProps) {
	if (visual === "page") {
		return <div className={styles.shape}>?</div>;
	}

	if (visual === "server") {
		return <div className={`${styles.shape} ${styles.server_shape}`}>ERROR</div>;
	}

	return (
		<div className={styles.mark}>
			<span>OC</span>

			<Icon visual={visual} />
		</div>
	);
}

export default function ErrorScreen({title, description, actions, visual}: ErrorScreenProps) {
	return (
		<main className={styles.main} data-no-footer>
			<section className={styles.copy}>
				<div className={styles.mobile_icon}>
					<Icon visual={visual} />
				</div>

				<h1>{title}</h1>

				<p>{description}</p>

				<div className={styles.actions}>{actions}</div>
			</section>

			<div className={`${styles.visual} ${visual === "page" ? styles.striped : ""}`} aria-hidden="true">
				<Visual visual={visual} />
			</div>
		</main>
	);
}
