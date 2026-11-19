import "server-only";
import nodemailer, {type Transporter} from "nodemailer";

/* Gmail SMTP를 앱 비밀번호로 쓴다. Google 계정에 2단계 인증이 켜져 있어야 앱 비밀번호를
   만들 수 있다. 하루 500통 한도가 있다(https://support.google.com/mail/answer/22839).
   https://nodemailer.com/guides/using-gmail */
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
	if (transporter === null) {
		transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.GMAIL_USER,
				pass: process.env.GMAIL_APP_PASSWORD,
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
			address: process.env.GMAIL_USER ?? "",
		},
		subject,
		html,
		...option,
	});
}
