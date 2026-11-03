// 컨시어지 MVP: 결제 의사 측정 모달, 신청 수집, 동의 절차, 사업자 정보 푸터 (백엔드 없음)
const won = n => "₩" + n.toLocaleString("ko-KR");

function saveLead(type, data) {
  const lead = { type, ...data, page: location.pathname.split("/").pop(), at: new Date().toISOString(), terms: TERMS_DATE };
  console.log("[woncheon lead]", lead);
  try {
    const all = JSON.parse(localStorage.getItem("woncheon_leads") || "[]");
    all.push(lead);
    localStorage.setItem("woncheon_leads", JSON.stringify(all));
  } catch {}
  if (LEAD_ENDPOINT) fetch(LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(lead),
  }).catch(() => {});
}

// ───── 동의 체크박스 (개인정보보호법 제15조: 항목·목적·보유기간·거부권 고지) ─────
const agree = (name, html) =>
  `<label class="check"><input type="checkbox" name="${name}" value="Y" required> <span>${html}</span></label>`;

const privacy = (items, purpose, keep) => `
  <div class="notice small">
    <b>개인정보 수집·이용 안내</b><br>
    항목: ${items} · 목적: ${purpose} · 보유기간: ${keep}<br>
    동의를 거부할 수 있으며, 거부 시 신청이 제한됩니다. <a href="terms.html#privacy" target="_blank"><u>개인정보처리방침</u></a>
  </div>
  ${agree("agree_privacy", "[필수] 만 14세 이상이며, 위 개인정보 수집·이용에 동의합니다.")}`;

const contactButtons = () => [
  CONTACT.kakao && `<a class="btn ghost" href="${CONTACT.kakao}" target="_blank">카카오톡 오픈채팅</a>`,
  CONTACT.email && `<a class="btn ghost" href="mailto:${CONTACT.email}">${CONTACT.email}</a>`,
].filter(Boolean).join(" ");

// ───── 모달 ─────
const dlg = document.createElement("dialog");
document.body.append(dlg);
dlg.addEventListener("click", e => { if (e.target === dlg || e.target.hasAttribute("data-close")) dlg.close(); });

function openDialog(html) {
  dlg.innerHTML = `<button class="x" data-close aria-label="닫기">×</button><div>${html}</div>`;
  dlg.showModal();
}

function success(el, text) {
  const ok = document.createElement("div");
  ok.className = "ok";
  ok.textContent = text;
  el.replaceWith(ok);
}

// 모달 안의 form 하나를 저장 + 성공 메시지로 연결
function onForm(form, type, extra, message) {
  form.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    saveLead(type, { ...extra, ...d });
    success(form, typeof message === "function" ? message(d) : message);
  };
}

function openPay(planName, asset) {
  const plan = PLANS[planName];
  if (plan.soon) return openB2B(planName);
  const amount = plan.beta ?? plan.price;

  openDialog(`
    <h2>${planName} 베타 신청</h2>
    <div class="tabs" id="ptabs">
      <button class="on" data-p="a">사전 신청</button>
      <button data-p="b">베타 입금 신청</button>
    </div>
    <form data-p="a">
      <p class="muted">현재 1차 클로즈드 베타 신청 중입니다. 이메일을 남겨주시면 2차 정식 오픈 때 50% 할인 쿠폰과 에셋 모음집을 보내드립니다.</p>
      <input type="email" name="email" required placeholder="이메일">
      ${privacy("이메일", "정식 오픈 안내, 할인 쿠폰 발송", "정식 오픈 후 6개월 또는 동의 철회 시까지")}
      ${agree("agree_ads", "[필수] 할인 쿠폰 등 광고성 정보를 이메일로 받는 데 동의합니다. 언제든 수신을 거부할 수 있습니다.")}
      <button class="btn">신청하기</button>
    </form>
    <form data-p="b" hidden>
      <p class="muted">${plan.beta ? "베타 기간 한정 50% 할인, " : ""}월 ${won(amount)}${plan.beta ? ` <s>${won(plan.price)}</s>` : ""}. 아래 계좌로 입금하고 입금자명과 이메일을 남겨주시면 1시간 안에 구글 드라이브 접근 권한을 보내드립니다.</p>
      <p class="bank">${BANK}</p>
      <input type="text" name="name" required placeholder="입금자명">
      <input type="email" name="email" required placeholder="이메일">
      <p class="muted small">1개월 이용권이며 자동으로 갱신되거나 결제되지 않습니다.</p>
      ${agree("agree_terms", `[필수] <a href="terms.html" target="_blank"><u>이용약관</u></a>과 <a href="terms.html#license" target="_blank"><u>라이선스 범위</u></a>에 동의합니다.`)}
      ${agree("agree_refund", `[필수] 디지털 콘텐츠 특성상 구글 드라이브 권한을 받은 뒤 에셋을 1회 이상 열람하거나 다운로드하면 청약철회(환불)가 제한됨을 확인했습니다. (전자상거래법 제17조 제2항) <a href="terms.html#refund" target="_blank"><u>환불 규정</u></a>`)}
      ${privacy("입금자명, 이메일", "입금 확인, 이용 권한 제공", "거래 종료 후 5년 (전자상거래법상 대금결제 기록 보존)")}
      <button class="btn">입금 완료 신청</button>
    </form>`);

  dlg.querySelector("#ptabs").onclick = e => {
    const p = e.target.dataset.p;
    if (!p) return;
    dlg.querySelectorAll("#ptabs button").forEach(b => b.classList.toggle("on", b === e.target));
    dlg.querySelectorAll("form").forEach(f => f.hidden = f.dataset.p !== p);
  };
  const [a, b] = dlg.querySelectorAll("form");
  onForm(a, "waitlist", { plan: planName, asset }, "신청되었습니다. 정식 오픈 때 할인 쿠폰과 에셋 모음집을 메일로 보내드릴게요.");
  onForm(b, "deposit", { plan: planName, asset, amount }, d => `입금이 확인되면 1시간 안에 ${d.email} 로 구글 드라이브 권한을 보내드립니다.`);
}

function openB2B(planName) {
  openDialog(`
    <h2>${planName} 사전 예약 <span class="tag">COMING SOON</span></h2>
    <form>
      <p class="muted">팀 단위 요금제는 준비 중입니다. 남겨주시면 오픈 전에 먼저 연락드립니다.</p>
      <input type="text" name="company" required placeholder="회사명">
      <input type="email" name="email" required placeholder="업무용 이메일">
      ${privacy("회사명, 이메일", "B2B 요금제 오픈 안내, 도입 상담", "안내 완료 후 6개월 또는 동의 철회 시까지")}
      <button class="btn">사전 예약</button>
    </form>`);
  onForm(dlg.querySelector("form"), "b2b", { plan: planName }, "예약되었습니다. 오픈 전에 메일로 연락드리겠습니다.");
}

// data-pay 속성이 붙은 버튼은 전부 결제 의사 모달을 연다
document.addEventListener("click", e => {
  const b = e.target.closest("[data-pay]");
  if (!b) return;
  e.preventDefault();
  openPay(b.dataset.pay || "Pro", b.dataset.asset);
});

// 전자상거래법 제10조 사업자 정보 + 약관 링크
document.querySelector(".main")?.insertAdjacentHTML("beforeend", `
  <footer class="foot small muted">
    <p><a href="terms.html">이용약관</a> · <a href="terms.html#license">라이선스</a> · <a href="terms.html#refund">환불 규정</a> · <a href="terms.html#creator">매입 약관</a> · <b><a href="terms.html#privacy">개인정보처리방침</a></b></p>
    <p>${BUSINESS.name} · 대표 ${BUSINESS.ceo} · 사업자등록번호 ${BUSINESS.regNo} · 통신판매업 ${BUSINESS.mailOrderNo}<br>
    ${BUSINESS.address} · ${BUSINESS.phone}${CONTACT.email ? " · " + CONTACT.email : ""}</p>
    <p>사이트의 모든 인물 이미지는 생성형 AI로 만든 가상 인물입니다.</p>
  </footer>`);
