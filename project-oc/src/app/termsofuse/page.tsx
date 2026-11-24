import type {Metadata} from "next";
import LegalDocument from "@/app/_components/legal/LegalDocument";
import {TERMS_OF_USE_TEXT} from "./termsOfUseText";

export const metadata: Metadata = {
	title: "이용 정책 - 프로젝트 OC",
};

export default function TermsOfUsePage() {
	return <LegalDocument title="이용 정책" text={TERMS_OF_USE_TEXT} />;
}
