import {notFound} from "next/navigation";

/* /edit/[uuid] 형태로만 접근 가능한 라우트다. uuid 없이 /edit로 오면
   이 페이지가 매치되어 notFound()를 던지고, 최상위 디렉토리의 not-found.tsx를 그린다. */
export default function EditIndex() {
	notFound();
}
