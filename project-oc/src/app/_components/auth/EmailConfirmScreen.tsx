"use client";

import {useState} from "react";
import styles from "./EmailConfirmScreen.module.css";
import {ActionButton, LinkButton} from "@/components/ui/button";
import {confirmEmailChange} from "@/app/auth/[token]/confirmEmailChange";

interface EmailConfirmScreenProps {
	token: string;
	userName: string;
	newEmail: string;
	/** 링크를 연 브라우저가 로그인했는지. 끝난 뒤 "창작하러 가기"를 보여 줄지 정한다. */
	loggedIn: boolean;
}

type ConfirmState = {status: "idle"} | {status: "sending"} | {status: "success"; newEmail: string} | {status: "failure"; message: string};

/* 링크를 열면 어느 계정의 이메일을 어떤 주소로 바꾸는지 먼저 보여 주고, 버튼을 눌러야 바꾼다.
   남이 자기 계정에 내 주소를 넣어 보낸 메일일 수도 있어서 계정 이름을 꼭 보여 준다. */
export default function EmailConfirmScreen({token, userName, newEmail, loggedIn}: EmailConfirmScreenProps) {
	const [state, setState] = useState<ConfirmState>({status: "idle"});

	const handleConfirm = async () => {
		try {
			setState({status: "sending"});

			const result = await confirmEmailChange(token);

			if (result.success) {
				setState({status: "success", newEmail: result.newEmail});
			} else {
				setState({status: "failure", message: result.message});
			}
		} catch {
			setState({status: "failure", message: "이메일을 바꾸는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요."});
		}
	};

	/* 끝난 뒤(성공, 실패)의 버튼은 같다. 로그인했으면 창작하러 가기를 앞에 둔다. */
	const doneActions = (
		<>
			{loggedIn ? <LinkButton href="/create">창작하러 가기</LinkButton> : null}

			<LinkButton href="/" styleType={loggedIn ? "simple" : "attention"}>
				홈으로
			</LinkButton>
		</>
	);

	if (state.status === "success") {
		return (
			<main className={styles.main} data-no-footer>
				<section className={styles.box} aria-live="polite">
					<div className={`${styles.mark} ${styles.success}`} aria-hidden="true">
						<i className="bi bi-check-lg"></i>
					</div>

					<h1>이메일을 바꿨어요.</h1>

					<p>
						계정 이메일이 <strong>{state.newEmail}</strong> 주소로 바뀌었어요. 원래 주소로는 바뀌었다는 알림 메일을 보냈어요.
					</p>

					<div className={styles.actions}>{doneActions}</div>
				</section>
			</main>
		);
	}

	if (state.status === "failure") {
		return (
			<main className={styles.main} data-no-footer>
				<section className={styles.box} aria-live="polite">
					<div className={`${styles.mark} ${styles.failure}`} aria-hidden="true">
						<i className="bi bi-x-lg"></i>
					</div>

					<h1>인증하지 못했어요.</h1>

					<p>{state.message}</p>

					<div className={styles.actions}>{doneActions}</div>
				</section>
			</main>
		);
	}

	const sending: boolean = state.status === "sending";

	return (
		<main className={styles.main} data-no-footer>
			<section className={styles.box}>
				<div className={styles.mark} aria-hidden="true">
					<i className="bi bi-envelope"></i>
				</div>

				<h1>이메일을 바꿀까요?</h1>

				<p>
					<strong>{userName}</strong> 계정의 이메일을 아래 주소로 바꿔요.
				</p>

				<p className={styles.email}>{newEmail}</p>

				<p className={styles.note}>직접 요청한 게 아니라면 버튼을 누르지 말고 이 창을 닫아 주세요.</p>

				<div className={styles.actions}>
					<ActionButton styleType="attention" onClick={handleConfirm} disabled={sending}>
						{sending ? "변경 중" : "이메일 변경"}
					</ActionButton>

					<LinkButton href="/" styleType="simple">
						홈으로
					</LinkButton>
				</div>
			</section>
		</main>
	);
}
