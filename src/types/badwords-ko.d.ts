// badwords-ko — 공식 타입 정의가 없어 실제 사용하는 API만 최소 선언한다.
declare module "badwords-ko" {
  export default class Filter {
    constructor(options?: {
      emptyList?: boolean;
      list?: string[];
      placeHolder?: string;
      regex?: RegExp;
      replaceRegex?: RegExp;
    });
    isProfane(text: string): boolean;
    clean(text: string): string;
    addWords(...words: string[]): void;
    removeWords(...words: string[]): void;
  }
}
