/** Credentials 가입자의 Account.provider 값.
 *  Auth.js가 OAuth처럼 정해 주는 값이 없어 직접 정한다.
 *  auth.ts에 두면 이 값 하나를 쓰려고 next-auth 설정 전체를 불러오게 되어 따로 뺐다. */
export const NORMAL_PROVIDER = "normal" as const;
