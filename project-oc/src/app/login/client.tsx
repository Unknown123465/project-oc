"use client";

import styles from "./page.module.css";
import { PasswordInput, TextInput } from "../component/form/input";
import { NormalButton, SubmitButton } from "../component/form/button";
import { ChangeEvent, useActionState, useCallback, useState } from "react";
import Form from "next/form";
import loginAction from "./action";

export function LoginForm() {
    const [formState, formAction] = useActionState<string | null, FormData>(loginAction, null);

    const [userName, setUserName] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const userNameChange = useCallback((e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
        let { value } = e.target;
        value = value.substring(0, 20);

        setUserName(value);
    }, []);

    const passwordChange = useCallback((e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
        let { value } = e.target;
        value = value.substring(0, 50);

        setPassword(value);
    }, []);

    return (
        <>
            <Form className={styles.login_form} action={formAction}>
                <p className={styles.title}>사용자 이름</p>

                <TextInput name="userName" value={userName} onChange={userNameChange} placeholder="사용자 이름을 입력하세요" />

                <p className={styles.title}>사용자 비밀번호</p>

                <PasswordInput name="password" value={password} onChange={passwordChange} placeholder="비밀번호를 입력하세요" />

                <p className={styles.error}>{formState}</p>

                <SubmitButton width="100%" className={styles.submit_button} disabledIfPending pendingChildren="확인중">
                    로그인
                </SubmitButton>
            </Form>
        </>
    );
}
