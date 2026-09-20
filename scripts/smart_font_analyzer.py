import os
import sys
import re
import json
import urllib.parse
from PIL import Image, ImageStat, ImageFilter

sys.stdout.reconfigure(encoding='utf-8')

OCR_AVAILABLE = False
ocr_engine = None

try:
    from rapidocr_onnxruntime import RapidOCR
    ocr_engine = RapidOCR()
    OCR_AVAILABLE = True
    print("✓ RapidOCR initialized successfully.")
except Exception as e:
    print(f"RapidOCR warning: {e}")

def get_image_metrics(img_path):
    try:
        with Image.open(img_path) as img:
            w, h = img.size
            aspect = w / h
            small = img.resize((64, 64)).convert('L')
            stat = ImageStat.Stat(small)
            mean_b = stat.mean[0]
            contrast = stat.stddev[0]
            edges = small.filter(ImageFilter.FIND_EDGES)
            edge_intensity = ImageStat.Stat(edges).mean[0]
            return {
                "width": w,
                "height": h,
                "aspect": aspect,
                "brightness": round(mean_b, 1),
                "contrast": round(contrast, 1),
                "edge": round(edge_intensity, 1)
            }
    except Exception:
        return None

def extract_ocr(img_path):
    if not OCR_AVAILABLE or not ocr_engine:
        return "", []
    try:
        res, _ = ocr_engine(img_path)
        if not res:
            return "", []
        raw_lines = []
        words = []
        for line in res:
            text = line[1].strip()
            score = float(line[2])
            if score > 0.45 and len(text) > 0:
                raw_lines.append(text)
                c_matches = re.findall(r'[\u4e00-\u9fff]{1,10}', text)
                e_matches = re.findall(r'[A-Za-z]{3,16}', text)
                words.extend(c_matches)
                words.extend(e_matches)
        return " ".join(raw_lines), words
    except Exception:
        return "", []

def smart_identify(filename, size_bytes, ocr_full, ocr_words, metrics):
    fn_lower = filename.lower()
    ext = os.path.splitext(filename)[1].lower()
    clean_fn = os.path.splitext(filename)[0]
    clean_fn = re.sub(r'@[0-9a-zA-Z_]+', '', clean_fn)
    clean_fn = re.sub(r'_quality,[a-zA-Z0-9_]+', '', clean_fn)
    chinese_in_fn = re.findall(r'[\u4e00-\u9fff]{2,12}', clean_fn)

    # 1. Stroke Architecture / Radicals
    if any(k in filename for k in ['部首', '笔画', '黄金分割', '骨骼', '构架']):
        if '黄金分割' in clean_fn:
            num = re.search(r'\d+', clean_fn)
            n_str = f" #{num.group(0)}" if num else ""
            return f"黄金分割 · 几何骨架{n_str}", "汉字几何比例与辅助线规范", "笔画构架", ["黄金分割", "几何构架", "骨骼比例"]
        elif '部首' in clean_fn:
            return "部首演化 · 偏旁结构拆解", "汉字形体与偏旁造字规律研析", "笔画构架", ["部首拆解", "偏旁法则", "字形推演"]
        else:
            return "笔画设计 · 汉字构架重组", "笔形重塑与笔画系统推演", "笔画构架", ["笔画设计", "字构拆解", "结构美学"]

    # 2. Calligraphy & Ink
    if any(k in filename for k in ['书法', '道.jpg', '魂.jpg', '草', '楷', '行', '水墨', '無山居人', '不忘初心']):
        if '道' in clean_fn:
            return "道 · 苍劲墨意狂草", "气韵磅礴行云流水手书", "墨韵书法", ["传统墨韵", "狂草水墨", "气势浑成"]
        elif '魂' in clean_fn:
            return "魂 · 雄浑擘窠大字", "墨色浓重飞白神韵", "墨韵书法", ["水墨飞白", "擘窠大字", "苍劲有力"]
        elif '不忘初心' in clean_fn:
            return "不忘初心 · 泼墨行楷字效", "苍劲有力兼具现代排版气质", "墨韵书法", ["手书神韵", "行楷气骨", "水墨视觉"]
        elif '無山居人' in clean_fn or '书法呈现' in clean_fn:
            return "無山居人 · 意境水墨字形", "当代手书与平面构成融合", "墨韵书法", ["当代书法", "意境水墨", "文人字韵"]
        else:
            cand = next((w for w in ocr_words if re.match(r'^[\u4e00-\u9fff]{2,4}$', w)), None)
            w = cand if cand else (chinese_in_fn[0] if chinese_in_fn else "意境墨韵")
            return f"{w} · 泼墨写意字体", "水墨枯笔传统与现代革新", "墨韵书法", ["水墨书法", "手书神韵", "飞白墨意"]

    # 3. Posters / Movies / Key Visuals
    if any(k in filename for k in ['海报', 'Poster', '封面', 'COVER', '怪胎', '林柏宏', '深夜食堂', '盛夏光年', '开工大吉']):
        if '开工大吉' in clean_fn:
            return "开工大吉 · 潮酷几何标语", "力量感粗黑字体与潮玩视觉", "视觉海报", ["开工大吉", "潮酷黑体", "大字视觉"]
        elif '怪胎' in clean_fn:
            return "怪胎 (i WEiR DO) · 电影主标", "极具辨识度的错位偏旁重构", "视觉海报", ["电影主标", "排版视觉", "偏旁重构"]
        elif '深夜食堂' in clean_fn:
            return "深夜食堂 · 温暖手写字形", "治愈系餐饮海报版式精选", "视觉海报", ["版式应用", "生活美学", "暖心视觉"]
        elif '盛夏光年' in clean_fn:
            return "盛夏光年 · 青春映画字标", "插画意象与字体融合排版", "视觉海报", ["青春海报", "电影标语", "视觉合成"]
        else:
            cand = next((w for w in ocr_words if re.match(r'^[\u4e00-\u9fff]{2,6}$', w)), None)
            w = cand if cand else "视觉大幕"
            return f"{w} · 剧场主视觉排版", "震撼大幅字面编排与视觉呈现", "视觉海报", ["海报大字", "版面编排", "展映视效"]

    # 4. Japanese & Kanji
    if any(k in filename for k in ['日', '日本', '株式会社', '塾', 'ハイスピード', '海と日本', '寺子屋']):
        if '寺子屋' in clean_fn or '石岡' in clean_fn:
            return "石冈寺子屋塾 · 学舍识别", "和风进学塾严谨标志与假名", "日系字型", ["日式招牌", "私塾标志", "和风素雅"]
        elif '海と日本' in clean_fn:
            return "海と日本 PROJECT · 公益标准字", "亲和波纹海洋主题日文字形", "日系字型", ["日文汉字", "海洋公益", "品牌形象"]
        elif 'ハイスピード' in clean_fn:
            return "ハイスピードボーイズ · 极速汉字", "前卫尖锐字面折线设计", "日系字型", ["日式排版", "前卫字形", "几何张力"]
        else:
            return "东瀛风尚 · 日式汉字标本", "和风排版与假名汉字交融", "日系字型", ["日文排版", "东瀛韵味", "和风字型"]

    # 5. Logotypes & Commercial
    if any(k in filename for k in ['标志', '标准字', 'logo', 'Logo', 'Logotype', '商标', '參明治', '参明治', '迷路']):
        if '參明治' in clean_fn or '参明治' in clean_fn:
            return "参明治 · 创意料理品牌标准字", "三明治创意料理品牌全案标识", "标志标准字", ["品牌识别", "餐饮标志", "玩味标准字"]
        elif '迷路' in ocr_full or '迷路哲学' in clean_fn:
            return "迷路哲学 (Lost Philosophy) · 标准字", "手绘玩味中文个性标准字设计", "标志标准字", ["中文标准字", "手绘个性", "品牌字标"]
        elif 'kekkan' in fn_lower:
            return "Kekkan Design · 品牌标志集锦", "现代极简商业符号与字型矩阵", "标志标准字", ["品牌集锦", "极简字标", "商业识别"]
        else:
            cand = next((w for w in ocr_words if re.match(r'^[\u4e00-\u9fff]{2,6}$', w)), None)
            w = cand if cand else (chinese_in_fn[0] if chinese_in_fn else "品牌标识")
            return f"{w} · 商业标准字设计", "品牌识别系统与应用规范", "标志标准字", ["商业识别", "中文品牌字", "VI规范"]

    # 6. Awards / Masterpiece
    if any(k in filename for k in ['大赛', '获奖', '白金创意', 'KONGNOK', '空 KONGNOK', '觅风']):
        if '白金创意' in clean_fn:
            return "白金创意国际大赛 · 获奖作品", "第二十届白金创意字体单元金奖", "获奖大作", ["白金创意", "国际大奖", "先锋字形"]
        elif 'KONGNOK' in filename:
            return "空 (KONGNOK) · 国际先锋大作", "极简空灵概念字构体系", "获奖大作", ["Behance精选", "国际大作", "先锋理念"]
        elif '觅风' in clean_fn:
            return "觅风 × 玩学岛 · 品牌全案包装字", "站酷精选全案原创品牌字设计", "获奖大作", ["站酷精选", "品牌全案", "金奖设计"]
        else:
            return "名家典藏 · 字体竞赛获奖佳作", "设计年鉴收录顶尖字体作品", "获奖大作", ["竞赛大奖", "年鉴精选", "大师风范"]

    # 7. Animated GIF
    if ext == '.gif':
        return "动态演绎 · 律动字效标本", "笔画生长与逐帧时空转换", "动效字体", ["动态演绎", "GIF字效", "时序笔触"]

    # 8. Creative fonts (chuangyi series)
    if 'chuangyi' in fn_lower:
        num_m = re.search(r'chuangyi-(\d+)', fn_lower)
        num_s = num_m.group(1) if num_m else "0"
        
        # Check if OCR recognized strong word
        cands = [w for w in ocr_words if re.match(r'^[\u4e00-\u9fff]{2,4}$', w) and w not in ['字体', '设计', '作品']]
        if cands:
            w = cands[0]
            return f"{w} · 创意字形 #{num_s}", "字面解构与概念字形实验", "创意字形", ["创意字形", "概念重构", "字面推演"]
        
        style = "解构字构"
        if metrics:
            if metrics["edge"] > 25: style = "重金属解构"
            elif metrics["contrast"] > 70: style = "高反差立体"
            elif metrics["aspect"] > 1.3: style = "宽幅潮流"
            else: style = "先锋几何"
            
        return f"创意字型 #{num_s.zfill(3)} · {style}", "字形骨骼拆解与空间置换探索", "创意字形", ["创意字体", style, "概念设计"]

    # 9. OCR recognized clear Chinese words
    cands = [w for w in ocr_words if re.match(r'^[\u4e00-\u9fff]{2,6}$', w) and w not in ['原创', '作品', '站酷', '版权']]
    if cands:
        main_w = cands[0]
        # Decide substyle
        if metrics and metrics["contrast"] > 65:
            cat = "现代字型"
            style_desc = "强对比现代几何版样"
        else:
            cat = "现代字型"
            style_desc = "当代字形审美与构成实验"
        return f"{main_w} · 现代字型", style_desc, cat, ["现代字型", "排版视觉", "审美探索"]

    # 10. OCR recognized English words
    e_cands = [w for w in ocr_words if re.match(r'^[A-Za-z]{3,14}$', w) and w.lower() not in ['design', 'font', 'behance', 'pinterest', 'com']]
    if e_cands:
        main_e = e_cands[0]
        return f"{main_e} · 现代西文/中英互文", "前沿多语种字体视觉实验", "现代字型", ["跨语种", "当代排版", "视觉探索"]

    # 11. Chinese in filename
    if chinese_in_fn:
        return f"{chinese_in_fn[0]} · 典藏字样", "名家字样标本研读", "现代字型", ["名家字样", "典藏标本", "平面视觉"]

    # 12. Fallback clean label
    h = clean_fn[:8].upper()
    return f"字型标本 {h} · 前沿设计", "当代汉字与西文字构采集", "现代字型", ["前沿设计", "字型档案", "灵感版样"]

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    images_dir = os.path.join(root_dir, "1000+优秀字体作品参考")
    valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    filenames = sorted(os.listdir(images_dir))
    
    total = len([f for f in filenames if os.path.splitext(f)[1].lower() in valid_exts])
    print(f"Starting smart identification for {total} font artworks...")
    
    catalog = []
    item_id = 1
    
    for fname in filenames:
        ext = os.path.splitext(fname)[1].lower()
        if ext not in valid_exts:
            continue
            
        full_p = os.path.join(images_dir, fname)
        size = os.path.getsize(full_p)
        metrics = get_image_metrics(full_p)
        
        # OCR extraction
        ocr_full, ocr_words = extract_ocr(full_p)
        
        # Intelligent identification
        title, sub_title, category, tags = smart_identify(fname, size, ocr_full, ocr_words, metrics)
        
        rel_path = f"1000+优秀字体作品参考/{urllib.parse.quote(fname)}"
        
        # Size formatting
        if size < 1024 * 1024:
            size_fmt = f"{size / 1024:.1f} KB"
        else:
            size_fmt = f"{size / (1024 * 1024):.1f} MB"
            
        catalog.append({
            "id": item_id,
            "title": title,
            "subTitle": sub_title,
            "originalName": fname,
            "category": category,
            "tags": tags,
            "ocrText": ocr_full[:160] if ocr_full else "",
            "src": rel_path,
            "rawSrc": f"1000+优秀字体作品参考/{fname}",
            "size": size_fmt,
            "sizeBytes": size,
            "ext": ext.lstrip('.').upper(),
            "metrics": metrics
        })
        
        if item_id % 50 == 0 or item_id == total:
            print(f"[{item_id}/{total}] Processed: {title} ({category})")
            
        item_id += 1

    # Write output to js/catalog-data.js
    js_file = os.path.join(root_dir, "js", "catalog-data.js")
    with open(js_file, "w", encoding="utf-8") as f:
        f.write("// Autogenerated intelligent font catalog\n")
        f.write("window.FONT_CATALOG = ")
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        f.write(";\n")
        
    print(f"\n✓ Successfully identified and saved {len(catalog)} font specimens into {js_file}!")

if __name__ == "__main__":
    main()
