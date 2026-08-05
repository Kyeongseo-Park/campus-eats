import Filter from "badwords-ko";

const filter = new Filter();

export function isProfane(text: string): boolean {
  return filter.isProfane(text);
}

// 원문은 절대 변형하지 않는다 — 화면 표시용으로만 마스킹된 버전을 만들어 반환한다.
export function getDisplayContent(content: string, containsProfanity: boolean): string {
  return containsProfanity ? filter.clean(content) : content;
}
