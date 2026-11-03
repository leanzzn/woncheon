// ───── 운영 전 반드시 실제 값으로 바꿀 것 ─────
const BANK = "OO은행 123-456-7890 (예금주 원천)";
const CONTACT = { kakao: "", email: "" }; // 오픈채팅 링크, 문의 메일. 비어 있으면 안내 문구만 나옴
// 신청 데이터를 받을 주소 (예: Formspree). 비어 있으면 방문자 브라우저 localStorage에만 저장됨 → 운영자는 못 봄
const LEAD_ENDPOINT = "";
// 전자상거래법 제10조: 사이트 하단에 표시해야 하는 사업자 정보
const BUSINESS = {
  name: "원천 (woncheon)",
  ceo: "대표자명",
  regNo: "000-00-00000",       // 사업자등록번호
  mailOrderNo: "제0000-서울XX-0000호", // 통신판매업 신고번호 (돈을 받기 전에 신고 필수)
  address: "사업장 주소",
  phone: "연락처",
  privacyOfficer: "개인정보 보호책임자 이름 / 이메일",
};
const TERMS_DATE = "2026-11-03"; // 약관 시행일

// 매입 완료된 에셋 목록. 새 에셋은 여기에 추가.
// 무료 공개 에셋: sample = 전체 팩 ZIP (make-pack.py로 1536x1024 시트에서 생성). 첫 번째가 대표 모델 (크리에이터 가이드 예시 이미지로 사용)
const asset = (id, name, tags, profile, tier = "PRO") => ({
  id, name, tier,
  sheet: `previews/${id}.jpg`, gallery: `previews/${id}/`, sample: `samples/${id}-sample.zip`,
  added: "2026-11-03", tags, profile,
});
const ASSETS = [
  asset("seoyeon", "한서연", ["한국인", "긴 웨이브 머리", "캐주얼", "여성"],
    { 나이: "28", 키: "167cm", 체형: "슬림, 균형 잡힌 비율", 헤어: "갈색 긴 웨이브, 부드러운 결", 눈: "짙은 갈색, 동그랗고 생기 있는 눈", 피부톤: "밝고 맑은 피부" }),
  asset("dohyun", "이도현", ["한국인", "짧은 머리", "캐주얼", "남성"],
    { 나이: "29", 키: "188cm", 체형: "슬림, 탄탄한 체형", 헤어: "검은색 짧은 머리, 자연스러운 결", 눈: "짙은 갈색, 날렵하고 시크한 눈매", 피부톤: "밝고 맑은 피부" }),
  asset("jaemin", "강재민", ["한국인", "텍스처드 컷", "미니멀", "남성"],
    { 나이: "26", 키: "188cm", 체형: "매우 마른 체형", 헤어: "검은색 짧은 텍스처드 컷", 눈: "짙은 갈색, 날렵하고 가는 눈매", 피부톤: "밝고 맑은 피부" }),
  // 디테일·분석 컷이 없는 시트 → BASIC 등급 (Lite 플랜)
  asset("jiho", "강지호", ["한국인", "짧은 텍스처드 머리", "스트릿", "남성"],
    { 나이: "27", 키: "188cm", 체형: "큰 키, 마르고 균형 잡힌 체형", 헤어: "검은색 아주 짧은 텍스처드 머리", 눈: "짙은 갈색, 가늘고 날렵한 눈매", 피부톤: "밝고 맑은 피부" }, "BASIC"),
  asset("haeun", "김하은", ["한국인", "웨이브 단발", "캐주얼", "여성"],
    { 나이: "22", 키: "152cm", 체형: "아담하고 슬림한 체형", 헤어: "검은색 짧은 웨이브 단발, 부드러운 결", 눈: "짙은 갈색, 동그랗고 생기 있는 눈", 피부톤: "밝고 맑은 피부" }, "BASIC"),
];

// 크리에이터 매입 단가
// 표준 이미지 팩 구조 ("model seperate" 폴더 구분): 업로드 슬롯 = ZIP 안 파일 = 상세 페이지 갤러리 탭. 슬롯마다 이미지 1장 + 프롬프트 필수
// tier: 이 등급부터 필수. BASIC = 01~04, PRO = 01~06. ex = 크리에이터 업로드 화면 예시 이미지
const SLOTS = [
  { id: "01_profile", ko: "캐릭터 프로필", tier: "BASIC", ex: "model seperate/model1.png", hint: "대표 얼굴 사진 + 프로필 표" },
  { id: "02_head_angles", ko: "머리 각도", tier: "BASIC", ex: "model seperate/model head angle.png", hint: "정면, 3/4, 좌·우 측면, 위·아래, 후면 7컷" },
  { id: "03_expressions", ko: "표정", tier: "BASIC", ex: "model seperate/model expression.png", hint: "무표정부터 웃음까지 9컷" },
  { id: "04_full_body", ko: "전신", tier: "BASIC", ex: "model seperate/model full body.png", hint: "정면, 3/4, 측면, 후면 4컷" },
  { id: "05_detail_closeups", ko: "디테일", tier: "PRO", ex: "model seperate/detail closeup.png", hint: "눈, 눈썹, 입술, 코, 피부, 헤어, 액세서리, 의상 소재" },
  { id: "06_hair_face_analysis", ko: "헤어·얼굴 분석", tier: "PRO", ex: "model seperate/hair analysis, face analysis.png", hint: "헤어 흐름·컬러 + 얼굴 비율·측면 구조" },
];
const PLAN_OF = { BASIC: "LITE", PRO: "PRO" }; // 에셋 등급 → 화면에 보이는 구독 플랜 이름
const slotsFor = tier => SLOTS.filter(g => tier === "PRO" || g.tier === "BASIC");
const countFor = tier => slotsFor(tier).length; // BASIC 4, PRO 6

// 크리에이터 매입 단가
const TIERS = {
  BASIC: { price: 20000, desc: `프로필·머리 각도·표정·전신 ${countFor("BASIC")}장` },
  PRO: { price: 25000, desc: `BASIC + 디테일 클로즈업·헤어/얼굴 분석 (총 ${countFor("PRO")}장)`, main: true },
};

// 텍스트 캐릭터 프로필 (모든 등급 필수) → profile.json
const PROFILE_FIELDS = [
  ["age", "나이", "25세"], ["height", "키", "168cm"], ["bodyType", "체형", "슬림, 균형 잡힌 비율"], ["ethnicity", "인종·민족", "한국인"],
  ["hair", "헤어", "갈색 긴 웨이브 머리"], ["eyes", "눈", "짙은 갈색, 아몬드형"], ["skinTone", "피부톤", "밝고 맑은 피부"],
];

// 구독 요금제
const PLANS = {
  Lite: { price: 15000, who: "개인 유튜버, 릴스 제작자", perks: ["월 10개 팩 다운로드", "4K 개별 PNG 이미지 팩"] },
  Pro: { price: 35000, beta: 17500, who: "1인 외주 제작자, 마케터", perks: ["무제한 다운로드", "디테일·헤어·얼굴 분석 컷 포함", "상업적 이용 라이선스"], main: true },
  Agency: { price: 129000, who: "에이전시, 제작사", perks: ["5인 팀 계정", "상업적 이용 라이선스 보증서"], soon: true },
};

// 매입 가능한 베이스 모델 (상업적 이용이 허용된 라이선스만)
const BASE_MODELS = [
  "FLUX.1 [schnell] (Apache 2.0)",
  "SDXL 1.0 (CreativeML Open RAIL++-M)",
  "Stable Diffusion 1.5 (CreativeML Open RAIL-M)",
  "기타 MIT / Apache 2.0 라이선스 모델 (메모에 모델명 기재)",
];
