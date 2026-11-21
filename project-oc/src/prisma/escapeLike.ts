/* Prisma의 contains는 MySQL의 LIKE '%값%'이 되는데, 값 안의 %와 _는 이스케이프하지 않는다.
   그래서 "%"로 검색하면 모든 행이, "_"로 검색하면 한 글자 이상인 모든 행이 걸린다.
   MySQL LIKE의 기본 이스케이프 문자가 \라서 \, %, _ 앞에 \를 붙인다.
   \도 같이 바꾸는 이유는 검색어 끝의 \가 뒤에 붙는 %를 글자로 바꿔 버리기 때문이다.
   세 글자를 정규식 한 번으로 바꾸므로, 새로 붙인 \를 다시 이스케이프하는 일은 없다. */
export function escapeLike(keyword: string): string {
	return keyword.replace(/(\\|%|_)/g, (char) => `\\${char}`);
}
