import Form from "next/form";
import styles from "./SocialLoginList.module.css";
import {SubmitButton} from "@/components/ui/button";
import {googleLoginAction, naverLoginAction, twitterLoginAction} from "@/app/login/action";

const socialLogins = [
	{provider: "google", label: "구글로 로그인", action: googleLoginAction},
	{provider: "naver", label: "네이버로 로그인", action: naverLoginAction},
	{provider: "twitter", label: "X(트위터)로 로그인", action: twitterLoginAction},
];

export default function SocialLoginList() {
	return (
		<div className={styles.social}>
			{socialLogins.map(({provider, label, action}) => (
				<Form key={provider} action={action}>
					<SubmitButton styleType="simple">{label}</SubmitButton>
				</Form>
			))}
		</div>
	);
}
