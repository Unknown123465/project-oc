import type {Metadata} from "next";
import LegalDocument from "@/app/_components/legal/LegalDocument";
import {PRIVACY_POLICY_TEXT} from "./privacyPolicyText";

export const metadata: Metadata = {
	title: "개인정보 처리방침 - 프로젝트 OC",
};

export default function PrivacyPolicyPage() {
	return <LegalDocument title="개인정보 처리방침" text={PRIVACY_POLICY_TEXT} />;
}
