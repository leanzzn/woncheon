# 1536x1024 캐릭터 시트 (model/x4/에 Real-ESRGAN 4배 업스케일본이 있으면 그걸 사용) → previews/<id>/<slot>.jpg + previews/<id>.jpg + samples/<id>-sample.zip
import sys, json, io, zipfile, os
from PIL import Image
root = sys.argv[1] if len(sys.argv) > 1 else "."
os.chdir(root)
# "model seperate" 폴더와 같은 6구역 (data.js SLOTS의 id와 일치해야 함). 좌표는 1536x1024 시트 기준
BOX = {
 "01_profile": (8,4,975,324), "02_head_angles": (8,324,1034,520), "03_expressions": (8,527,1034,702),
 "04_full_body": (1043,322,1532,812), "05_detail_closeups": (8,705,1034,836), "06_hair_face_analysis": (8,838,1176,1020),
}
THUMB = (10,6,427,318)  # 목록 썸네일 (대표 얼굴 사진)
# 레이아웃이 다른 시트는 좌표를 따로 (원본 픽셀 기준). 디테일·분석이 없는 시트 = BASIC(Lite) 4구역
LAYOUT = {
 "jiho": ({"01_profile": (8,5,988,492), "02_head_angles": (998,681,2040,1053), "03_expressions": (1012,118,2043,469), "04_full_body": (12,520,981,1128)}, (10,8,420,490)),
 "haeun": ({"01_profile": (660,563,1530,968), "02_head_angles": (660,302,1530,547), "03_expressions": (5,5,1530,272), "04_full_body": (5,300,655,982)}, (663,567,1070,962)),
}
MODELS = {
 "seoyeon": ("model/20261103_051430_c59ab2675b9b6ecfdcf0c2560bee7eb2.png", dict(이름="한서연", 나이=28, 키_cm=167, 체형="슬림, 균형 잡힌 비율", 인종="한국인", 헤어="갈색 긴 웨이브, 부드러운 결", 눈="짙은 갈색, 동그랗고 생기 있는 눈", 피부톤="밝고 맑은 피부", 특징=["귀엽고 따뜻한 인상","자연스럽고 사랑스러운 표정","부드럽고 여성스러운 분위기","우아한 비율","캐주얼부터 페미닌까지 어울리는 스타일"])),
 "dohyun": ("model/20261103_052210_8701ae155ac1991b66cea510a4a73789.png", dict(이름="이도현", 나이=29, 키_cm=188, 체형="슬림, 탄탄한 체형", 인종="한국인", 헤어="검은색 짧은 머리, 자연스러운 결", 눈="짙은 갈색, 날렵하고 시크한 눈매", 피부톤="밝고 맑은 피부", 특징=["잘생기고 시크한 인상","뚜렷하고 선명한 이목구비","차분하고 자신감 있는 분위기","큰 키와 슬림한 비율","모던·캐주얼 스타일이 잘 어울림"])),
 "jaemin": ("model/20261103_052621_304c4a1f68fd8dfd4f6c87362a134483.png", dict(이름="강재민", 나이=26, 키_cm=188, 체형="매우 마른 체형", 인종="한국인", 헤어="검은색 짧은 텍스처드 컷", 눈="짙은 갈색, 날렵하고 가는 눈매", 피부톤="밝고 맑은 피부", 특징=["뱀상 매력이 있는 미남","뚜렷하고 선명한 이목구비","차갑고 차분하며 신비로운 분위기","큰 키와 매우 마른 체형","미니멀·모던 스타일이 잘 어울림"])),
 "jiho": ("model/model1.png", dict(이름="강지호", 나이=27, 키_cm=188, 체형="큰 키, 마르고 균형 잡힌 체형", 인종="한국인", 헤어="검은색 아주 짧은 텍스처드 머리", 눈="짙은 갈색, 가늘고 날렵한 눈매", 피부톤="밝고 맑은 피부", 특징=["강렬하고 카리스마 있는 인상","날렵하고 남성적인 이목구비","도드라진 광대","쿨하고 자신감 있는 표정","캐주얼부터 스트릿까지 어울리는 모던 스타일"])),
 "haeun": ("model/model2.png", dict(이름="김하은", 나이=22, 키_cm=152, 체형="아담하고 슬림한 체형", 인종="한국인", 헤어="검은색 짧은 웨이브 단발, 부드러운 결", 눈="짙은 갈색, 동그랗고 생기 있는 눈", 피부톤="밝고 맑은 피부", 특징=["귀엽고 순수한 인상","자연스럽고 사랑스러운 표정","짧은 웨이브 단발","발그레한 블러셔 메이크업","아담하고 앳된 분위기","캐주얼·페미닌 모두 어울리는 스타일"])),
}
for mid, (src, prof) in MODELS.items():
    box, thumb = LAYOUT.get(mid, (BOX, THUMB))
    hd = os.path.join("model/x4", os.path.basename(src))
    im = Image.open(hd if os.path.exists(hd) else src).convert("RGB")
    k = im.width / (1536 if mid not in LAYOUT else Image.open(src).width)
    cut = lambda b: im.crop(tuple(round(v * k) for v in b))
    os.makedirs(f"previews/{mid}", exist_ok=True)
    for old in os.listdir(f"previews/{mid}"): os.remove(f"previews/{mid}/{old}")  # 예전 구분의 컷 정리
    cut(thumb).save(f"previews/{mid}.jpg", quality=90)
    with zipfile.ZipFile(f"samples/{mid}-sample.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for slot, b0 in box.items():
            c = cut(b0); c.save(f"previews/{mid}/{slot}.jpg", quality=90)
            b = io.BytesIO(); c.save(b, "PNG"); z.writestr(f"{slot}.png", b.getvalue())
        z.write(src, "character_sheet.png")
        z.writestr("profile.json", json.dumps(prof, ensure_ascii=False, indent=2))
        z.writestr("LICENSE.txt", f"원천 (woncheon) 무료 에셋 팩 · {prof['이름']}\n\n- 무료로 내려받아 비상업적 용도로 사용할 수 있습니다.\n- 재배포, 재판매, AI 학습용 데이터셋 사용은 금지됩니다.\n- 생성형 AI로 만든 가상 인물입니다. 실존 인물로 오인하게 하거나 실존 인물과 합성하는 데 쓸 수 없습니다.\n- 상업적으로 쓰려면 구독이 필요합니다. 전체 조건: terms.html#license\n")
