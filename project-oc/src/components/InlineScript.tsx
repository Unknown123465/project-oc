interface InlineScriptProps {
	html: string;
	nonce?: string;
}

/* 순수 <script>는 최초 HTML 파싱 때만 실행된다. notFound() 등으로 React가 이 자리를
   클라이언트에서 다시 그려야 할 때는(에러 바운더리 복구) 같은 노드를 다시 만들 뿐
   실행은 하지 않는데, 그 사실을 개발 모드가 경고로 알린다("Encountered a script tag
   while rendering...") - 이 컴포넌트를 거치지 않고 raw <script>를 쓰면 이 경고가 뜬다.

   type을 서버/클라이언트에서 다르게 주는 게 그 경고를 없애는 방법이다(Next 공식 가이드
   "Preventing flash before hydration"). 서버는 실제로 실행돼야 하니 text/javascript,
   클라이언트가 같은 트리를 다시 그릴 때는 text/plain으로 내려가는데 브라우저가 애초에
   text/plain 스크립트를 실행 대상으로 보지 않아 React도 "실행 안 된다"고 경고할 이유가
   없어진다. suppressHydrationWarning은 서버가 심은 text/javascript와 클라이언트가
   그리려는 text/plain의 불일치(hydration mismatch)를 무시하게 한다 - 이미 실행된
   스크립트를 클라이언트 값으로 되돌릴 이유가 없기 때문이다. */
export function InlineScript({html, nonce}: InlineScriptProps) {
	return <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{__html: html}} />;
}
