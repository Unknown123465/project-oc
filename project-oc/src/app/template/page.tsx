import {notFound} from "next/navigation";

/* /template/[uuid] 형태로만 접근 가능한 라우트다. uuid 없이 /template로 오면
   이 페이지가 매치되어 notFound()를 던지고, 형제 파일인 not-found.tsx가 그 결과를 그린다.
   [uuid]/page.tsx에서 DB에 없는 uuid로 notFound()를 던졌을 때도 같은 not-found.tsx로 모인다. */
export default function TemplateIndex() {
	notFound();
}
