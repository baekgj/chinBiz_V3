"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Field from "@/components/auth/Field";
import TermModal from "@/components/site/TermModal";
import { apiGet, apiPost } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/;
const ID_RE = /^[a-zA-Z0-9]{4,20}$/;

const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20";
const readonlyCls =
  "w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted/60 cursor-default";

type Form = {
  name: string;
  userId: string;
  password: string;
  passwordConfirm: string;
  email: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  referral: string;
};

/* Daum(카카오) 우편번호 스크립트 동적 로더 */
function loadDaumPostcode(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    const w = window as unknown as { daum?: { Postcode: unknown } };
    if (w.daum?.Postcode) return resolve();
    const id = "daum-postcode-script";
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.body.appendChild(s);
  });
}

export default function SignupPage() {
  const router = useRouter();
  const [f, setF] = useState<Form>({
    name: "",
    userId: "",
    password: "",
    passwordConfirm: "",
    email: "",
    phone: "",
    zipcode: "",
    address: "",
    addressDetail: "",
    referral: "",
  });
  const [idStatus, setIdStatus] = useState<"idle" | "checking" | "ok" | "dup">("idle");
  const [agreeAll, setAgreeAll] = useState(false);
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false });
  const [errors, setErrors] = useState<Partial<Record<keyof Form | "agree", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [viewTerm, setViewTerm] = useState<{ code: string; title: string } | null>(null);

  const set = (k: keyof Form) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));

  // 추천 링크(?ref=회원id)로 접속 시 추천인 코드 자동 반영
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setF((prev) => ({ ...prev, referral: ref }));
  }, []);

  function onIdChange(v: string) {
    setF((prev) => ({ ...prev, userId: v }));
    setIdStatus("idle"); // 아이디 변경 시 재확인 필요
  }

  async function checkId() {
    if (!ID_RE.test(f.userId)) {
      setErrors((e) => ({ ...e, userId: "아이디는 영문/숫자 4~20자로 입력해 주세요." }));
      return;
    }
    setErrors((e) => ({ ...e, userId: undefined }));
    setNotice(null);
    setIdStatus("checking");
    try {
      const res = await apiGet<{ available: boolean }>(
        `/api/auth/check-id?userId=${encodeURIComponent(f.userId)}`,
      );
      if (!res.ok) throw new Error();
      setIdStatus(res.data?.available ? "ok" : "dup");
    } catch {
      setIdStatus("idle");
      setNotice("아이디 중복확인 중 서버 연결에 실패했습니다. 백엔드(9001) 실행 여부를 확인해 주세요.");
    }
  }

  async function openPostcode() {
    try {
      await loadDaumPostcode();
    } catch {
      setNotice("우편번호 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const w = window as unknown as {
      daum: {
        Postcode: new (opts: {
          oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
        }) => { open: () => void };
      };
    };
    new w.daum.Postcode({
      oncomplete: (data) => {
        const addr = data.roadAddress || data.jibunAddress;
        setF((prev) => ({ ...prev, zipcode: data.zonecode, address: addr }));
        setErrors((e) => ({ ...e, address: undefined }));
        document.getElementById("addressDetail")?.focus();
      },
    }).open();
  }

  function toggleAll(v: boolean) {
    setAgreeAll(v);
    setAgree({ terms: v, privacy: v, marketing: v });
  }
  function toggleOne(k: keyof typeof agree, v: boolean) {
    const next = { ...agree, [k]: v };
    setAgree(next);
    setAgreeAll(next.terms && next.privacy && next.marketing);
  }

  function validate() {
    const e: typeof errors = {};
    if (!f.name.trim()) e.name = "이름을 입력해 주세요.";
    if (!f.userId) e.userId = "아이디를 입력해 주세요.";
    else if (!ID_RE.test(f.userId)) e.userId = "아이디는 영문/숫자 4~20자로 입력해 주세요.";
    else if (idStatus !== "ok") e.userId = "아이디 중복확인을 해주세요.";
    if (!f.password) e.password = "비밀번호를 입력해 주세요.";
    else if (f.password.length < 10) e.password = "비밀번호는 10자 이상이어야 합니다.";
    if (f.passwordConfirm !== f.password) e.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    if (!f.email) e.email = "이메일을 입력해 주세요.";
    else if (!EMAIL_RE.test(f.email)) e.email = "올바른 이메일 형식이 아닙니다.";
    if (!f.phone) e.phone = "휴대폰 번호를 입력해 주세요.";
    else if (!PHONE_RE.test(f.phone)) e.phone = "올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)";
    if (!f.zipcode || !f.address) e.address = "우편번호 검색으로 주소를 입력해 주세요.";
    if (!agree.terms || !agree.privacy) e.agree = "필수 약관에 동의해 주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await apiPost(`/api/auth/signup`, {
        userId: f.userId,
        password: f.password,
        name: f.name,
        email: f.email,
        phone: f.phone,
        zipcode: f.zipcode,
        address: f.address,
        addressDetail: f.addressDetail,
        referralCode: f.referral,
        agreeMarketing: agree.marketing,
      });
      if (res.status === 201) {
        setNotice("🎉 회원가입이 완료되었습니다! 잠시 후 로그인 페이지로 이동합니다.");
        setTimeout(() => router.push("/login"), 1300);
      } else if (res.status === 409) {
        setIdStatus("dup");
        setErrors((e) => ({ ...e, userId: res.message ?? "이미 사용 중인 아이디입니다." }));
        setNotice(res.message ?? "이미 사용 중인 아이디입니다.");
      } else {
        setNotice(res.message ?? "가입에 실패했습니다. 입력값을 확인해 주세요.");
      }
    } catch {
      setNotice("서버 연결에 실패했습니다. 백엔드(9001) 실행 여부를 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="JOIN CHINBIZ"
      title="버즈회원 무료가입"
      subtitle="지금 가입하고 내 네트워크로 첫 영업을 시작해 보세요."
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {/* 아이디 + 중복확인 */}
        <div>
          <label htmlFor="userId" className="block text-sm font-semibold text-ink-soft">
            아이디<span className="ml-0.5 text-danger">*</span>
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="userId"
              name="userId"
              value={f.userId}
              onChange={(e) => onIdChange(e.target.value)}
              placeholder="영문/숫자 4~20자"
              autoComplete="username"
              aria-invalid={!!errors.userId}
              className={`flex-1 ${inputCls} ${errors.userId ? "border-danger/60 focus:border-danger focus:ring-danger/20" : ""}`}
            />
            <button
              type="button"
              onClick={checkId}
              disabled={idStatus === "checking"}
              className="shrink-0 rounded-xl border border-forest-600 px-4 py-2.5 text-sm font-semibold text-forest-600 transition-colors hover:bg-forest-50 disabled:opacity-60"
            >
              {idStatus === "checking" ? "확인 중…" : "중복확인"}
            </button>
          </div>
          {errors.userId ? (
            <p className="mt-1 text-xs text-danger">{errors.userId}</p>
          ) : idStatus === "ok" ? (
            <p className="mt-1 text-xs text-positive">사용 가능한 아이디입니다.</p>
          ) : idStatus === "dup" ? (
            <p className="mt-1 text-xs text-danger">이미 사용 중인 아이디입니다.</p>
          ) : null}
        </div>

        {/* 비밀번호 (아이디 아래로 이동) */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="비밀번호"
            type="password"
            name="password"
            value={f.password}
            onChange={set("password")}
            placeholder="10자 이상"
            autoComplete="new-password"
            error={errors.password}
            hint="10자 이상"
            required
          />
          <Field
            label="비밀번호 확인"
            type="password"
            name="passwordConfirm"
            value={f.passwordConfirm}
            onChange={set("passwordConfirm")}
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
            error={errors.passwordConfirm}
            required
          />
        </div>

        {/* 이름 (비밀번호 아래로 이동) */}
        <Field
          label="이름"
          name="name"
          value={f.name}
          onChange={set("name")}
          placeholder="홍길동"
          autoComplete="name"
          error={errors.name}
          required
        />

        <Field
          label="이메일"
          type="email"
          name="email"
          value={f.email}
          onChange={set("email")}
          placeholder="you@chinbiz.com"
          autoComplete="email"
          error={errors.email}
          required
        />

        <Field
          label="휴대폰 번호"
          name="phone"
          value={f.phone}
          onChange={set("phone")}
          placeholder="010-1234-5678"
          autoComplete="tel"
          error={errors.phone}
          required
        />

        {/* 주소 (휴대폰 번호 아래) */}
        <div>
          <label className="block text-sm font-semibold text-ink-soft">
            주소<span className="ml-0.5 text-danger">*</span>
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              value={f.zipcode}
              readOnly
              placeholder="우편번호"
              className={`w-36 ${readonlyCls}`}
            />
            <button
              type="button"
              onClick={openPostcode}
              className="shrink-0 rounded-xl border border-forest-600 px-4 py-2.5 text-sm font-semibold text-forest-600 transition-colors hover:bg-forest-50"
            >
              우편번호 검색
            </button>
          </div>
          <input
            value={f.address}
            readOnly
            placeholder="기본주소 (우편번호 검색 시 자동 입력)"
            className={`mt-2 ${readonlyCls}`}
          />
          <input
            id="addressDetail"
            value={f.addressDetail}
            onChange={(e) => set("addressDetail")(e.target.value)}
            placeholder="상세주소를 입력하세요"
            className={`mt-2 ${inputCls}`}
          />
          {errors.address && <p className="mt-1 text-xs text-danger">{errors.address}</p>}
        </div>

        <Field
          label="추천인 코드"
          name="referral"
          value={f.referral}
          onChange={set("referral")}
          placeholder="buzz_hong123 (선택)"
          hint="추천인을 입력하면 추천 네트워크에 연결됩니다."
        />

        {/* 약관 동의 */}
        <div className="rounded-xl border border-line bg-surface-2 p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
            <input
              type="checkbox"
              checked={agreeAll}
              onChange={(e) => toggleAll(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-forest-600"
            />
            전체 약관에 동의합니다
          </label>
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <AgreeRow label="(필수) 이용약관 동의" checked={agree.terms} onChange={(v) => toggleOne("terms", v)} onView={() => setViewTerm({ code: "BUZZ", title: "버즈회원 이용약관" })} />
            <AgreeRow label="(필수) 개인정보 수집·이용 동의" checked={agree.privacy} onChange={(v) => toggleOne("privacy", v)} onView={() => setViewTerm({ code: "PRIVACY_CONSENT", title: "개인정보 수집·이용 동의" })} />
            <AgreeRow label="(선택) 마케팅 정보 수신 동의" checked={agree.marketing} onChange={(v) => toggleOne("marketing", v)} />
          </div>
          {errors.agree && <p className="mt-2 text-xs text-danger">{errors.agree}</p>}
        </div>

        {notice && (
          <div className="rounded-xl border border-forest-300/50 bg-forest-50 px-4 py-3 text-sm text-forest-600">
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gold-400 px-6 py-3 font-bold text-forest-900 transition-colors hover:bg-gold-300 disabled:opacity-60"
        >
          {submitting ? "가입 처리 중…" : "무료로 가입하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-forest-600 hover:underline">
          로그인
        </Link>
      </p>

      {viewTerm && (
        <TermModal code={viewTerm.code} title={viewTerm.title} onClose={() => setViewTerm(null)} />
      )}
    </AuthLayout>
  );
}

function AgreeRow({
  label,
  checked,
  onChange,
  onView,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onView?: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm text-ink-soft">
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-line accent-forest-600"
        />
        {label}
      </span>
      {onView && (
        <button
          type="button"
          className="text-xs text-muted underline hover:text-forest-600"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onView(); }}
        >
          보기
        </button>
      )}
    </label>
  );
}
