import time
import re
import random
import json
from flask import current_app
from decimal import Decimal
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from app.services.asin_service import save_asin


def extract_asins_from_soup(html_content: str) -> list:
    """从 BSR 列表页提取 ASIN 列表"""
    soup = BeautifulSoup(html_content, 'html.parser')
    asins = []
    recs_elem = soup.find(attrs={"data-client-recs-list": True})
    if recs_elem:
        try:
            recs_str = recs_elem['data-client-recs-list']
            recs_list = json.loads(recs_str)
            for item in recs_list:
                if isinstance(item, dict) and 'id' in item:
                    asins.append(item['id'])
        except (json.JSONDecodeError, TypeError, KeyError) as error:
            print(error)

    return asins


def get_review_info(page):
    review = page.locator("#acrCustomerReviewText").first

    if review.count() == 0:
        return None
    return review.text_content().strip("()")


def get_price_info(page):
    price_whole = page.locator(".a-price-whole").first.text_content()
    price_fraction = page.locator(".a-price-fraction").first.text_content()

    if price_whole and price_fraction:
        return Decimal(price_whole + price_fraction)
    else:
        return None


RANK_RE = re.compile(r'#([\d,]+)\s+in\s+(.+?)(?:\s*\(|$)')


def get_rank_info(text):
    m = RANK_RE.search(text)
    if not m:
        return None, None

    rank = m.group(1).replace(',', '')
    name = m.group(2)
    return rank, name


def safe_text(tag):
    return tag.get_text(strip=True) if tag else None


SCRIPT_DIR = Path(__file__).resolve().parent
AUTH_FILE = SCRIPT_DIR / "auth.json"


def get_detail_value(page, label):
    row = page.locator(
        f'#prodDetails tr:has(th:has-text("{label}"))'
    )

    if row.count() == 0:
        row = page.locator(
            f'#features_and_specs tr:has(th:has-text("{label}"))'
        )

    if row.count() == 0:
        row = page.locator(
            f'#item_details tr:has(th:has-text("{label}"))'
        )

    if row.count() == 0:
        if label == "Best Sellers Rank":
            return None, None, None, None
        return None

    td = row.locator("td")

    if label == "Best Sellers Rank":
        rank_items = td.locator("ul .a-list-item").all()
        if len(rank_items) < 2:
            return None, None, None, None
        main_category = rank_items[0].text_content().strip()
        sub_category = rank_items[1].text_content().strip()

        main_category_rank, main_category_name = get_rank_info(main_category)
        sub_category_rank, sub_category_name = get_rank_info(sub_category)
        return main_category_name, main_category_rank, sub_category_name, sub_category_rank

    text = td.text_content()
    return text.strip() if text else None


def get_variants_info(page):
    variants = {}

    elements = page.locator("[id^='inline-twister-expanded-dimension-text-']")

    count = elements.count()

    for i in range(count):
        el = elements.nth(i)
        id_attr = el.get_attribute("id")
        key = id_attr.replace("inline-twister-expanded-dimension-text-", "")
        value = el.text_content().strip()
        variants[key] = value

    return variants


SIZES = {"king", "queen", "full", "twin"}


def extract_size(size_text):
    if size_text:
        text_lower = size_text.lower()
        for size in SIZES:
            if size in text_lower:
                return size.capitalize()
        return size_text
    return None


def extract_model(model):
    if model:
        match = re.search(r'\d+', model)
        if match:
            return match.group()
        return None
    else:
        return None


def normalize_variants(variants):
    model = None
    size = None

    for key, value in variants.items():
        key_lower = key.lower()

        # 👇 归类到 model
        if key_lower in ['model', 'item_thickness', 'thickness_style', 'style_name', 'item_shape']:
            model = value

        # 👇 归类到 size
        elif key_lower in ['size', 'size_name']:
            size = value

    pattern = re.compile(r'\b\d+\s*-?\s*(inch|in|")\b', re.I)
    if size and model and pattern.search(size):
        size, model = model, size
    return extract_model(model), extract_size(size)


MODEL_RE = re.compile(r'(\d+(?:\.\d+)?)\s*(?:inch|-inch| inch)')


def get_model_from_title(title):
    if title:
        lower_title = title.lower()
        model = MODEL_RE.findall(lower_title)
        if len(model) == 0:
            return None
        else:
            return model[0]
    else:
        return None


SIZE_RE = re.compile(r'\b(king|full|queen|twin)\b', re.I)


def get_size_from_title(title):
    if not title:
        return None

    match = SIZE_RE.search(title)
    if match:
        return match.group(1).capitalize()
    return None


def scrape_mattress_best_sellers():
    with sync_playwright() as p:
        # 1. 启动浏览器
        browser = p.chromium.launch(headless=True)  # 调试完可以改 True
        context = browser.new_context(storage_state=str(AUTH_FILE))
        page = context.new_page()
        # 拦截策略：不加载图片，节省 100 次详情页跳转的流量
        # page.route("**/*.{png,jpg,jpeg,svg,webp}", lambda route: route.abort())
        # 图片 字体 不加载
        page.route("**/*", lambda route: (
            route.abort()
            if route.request.resource_type in ["image", "font"]
            else route.continue_()
        ))

        all_asins = []
        bsr_base_url = "https://www.amazon.com/Best-Sellers-Home-Kitchen-Mattresses/zgbs/home-garden/3732981/"
        # 爬取前 2 页，共 100 个产品
        for pg in [1, 2]:
            print(f"[*] 正在从 BSR 第 {pg} 页扫码 ASIN...")
            page.goto(f"{bsr_base_url}?pg={pg}", wait_until="domcontentloaded")
            # 确保那个隐藏的 data 属性加载出来了
            page.wait_for_selector("[data-client-recs-list]")
            asins = extract_asins_from_soup(page.content())
            all_asins.extend(asins)
            print(f"[√] 成功获取 {len(asins)} 个 ASIN")
            time.sleep(random.uniform(1, 2))
        # 防止 ASIN 重复
        all_asins = list(set(all_asins))

        print(f"\n[!] 总计获取到 {len(all_asins)} 个 ASIN，准备开始抓取详情...")

        for index, asin in enumerate(all_asins):
            url = f"https://www.amazon.com/dp/{asin}?th=1"
            print(f"[{index + 1}/100] 正在抓取: {asin}")
            try:
                # page.goto(url, wait_until="domcontentloaded", timeout=60000)  # HTML 解析完成，可能还没有数据
                # page.goto(url, wait_until="networkidle", timeout=60000)  # 500ms 内无网络请求
                page.goto(url, timeout=60000)  # 等价于 page.goto(url, wait_until="load")
                # page.screenshot(path=f"{asin}debug.png", full_page=True)  # 生成屏幕快照，查看是否页面有内容
                title = page.locator("#productTitle").first.text_content().strip()
                review = get_review_info(page)
                price = get_price_info(page)
                variants = get_variants_info(page)
                model, size = normalize_variants(variants)
                main_name, main_rank, sub_name, sub_rank = get_detail_value(page, 'Best Sellers Rank')

                data = {
                    "title": title,
                    "review": int(re.sub(r'\D', "", review)) if review else 0,
                    "price": price,
                    "model": model.strip() if model else get_model_from_title(title),
                    "size": size.strip() if size else get_size_from_title(title),
                    "main_category_rank": int(main_rank) if main_rank else None,
                    "main_category_name": main_name,
                    "sub_category_rank": int(sub_rank) if sub_rank else None,
                    "sub_category_name": sub_name,
                    "asin": asin
                }

                save_asin(data)

            except Exception as e:
                print(f" [x] ASIN {asin} 抓取失败: {str(e)}")
                current_app.logger.error(f" [x] ASIN {asin} 抓取失败: {str(e)}")

            # 详情页之间必须有随机停顿，否则必封 IP
            sleep_time = random.choice([
                random.uniform(2, 5),
                random.uniform(5, 8),
                random.uniform(8, 12)
            ])
            time.sleep(sleep_time)

        print(f"\n[√] 任务完成！")
        browser.close()


if __name__ == "__main__":
    scrape_mattress_best_sellers()
