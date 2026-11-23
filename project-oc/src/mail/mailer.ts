import "server-only";
import nodemailer, {type Transporter} from "nodemailer";

/* Resend SMTP로 보낸다. 사용자 이름은 "resend"로 고정이고 비밀번호 자리에 API 키를 넣는다.
   무료 플랜은 하루 100통, 한 달 3,000통 한도가 있다(https://resend.com/docs/send-with-smtp).
   보내는 주소는 Resend에 인증한 도메인(projectoc.org)이어야 한다.
   운영자 개인 메일이 드러나지 않도록 replyTo는 넣지 않는다. */
const SMTP_HOST: string = "smtp.resend.com";
const SMTP_PORT: number = 465;
const SMTP_USER: string = "resend";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
	if (transporter === null) {
		transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: SMTP_PORT,
			secure: true,
			auth: {
				user: SMTP_USER,
				pass: process.env.RESEND_API_KEY,
			},
		});
	}

	return transporter;
}

type SendTargetRecord = {to: string} | {bcc: string} | {cc: string};

interface SendMailOtherOptions {
	subject: string;
	html: string;
}

type SendMailOptions = SendTargetRecord & SendMailOtherOptions;

/** 메일 한 통을 보낸다. 실패하면 예외를 그대로 올린다. 실패를 어떻게 다룰지는 부르는 쪽이 정한다. */
export async function sendMail({subject, html, ...option}: SendMailOptions): Promise<void> {
	await getTransporter().sendMail({
		from: {
			name: "프로젝트 OC",
			address: process.env.MAIL_FROM_ADDRESS ?? "",
		},
		subject,
		html,
		...option,
	});
}
