#!/usr/bin/env python3
"""
BusTech Pulse - Global Bus Technology News Aggregator
Standard Python script with zero third-party dependencies.
Runs seamlessly on GitHub Actions, Linux, Docker, or Local Machine.
"""

import os
import json
import re
import html
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime

SOURCES = [
    {
        "name": "Sustainable Bus",
        "url": "https://www.sustainable-bus.com/feed/",
        "category_id": "electric"
    },
    {
        "name": "Intelligent Transport",
        "url": "https://www.intelligenttransport.com/feed/",
        "category_id": "its"
    },
    {
        "name": "Google News: Bus Technology",
        "url": "https://news.google.com/rss/search?q=electric+bus+OR+autonomous+bus+OR+smart+transit+bus+technology&hl=en-US&gl=US&ceid=US:en",
        "category_id": "market"
    },
    {
        "name": "Google News: Autonomous Shuttles",
        "url": "https://news.google.com/rss/search?q=driverless+bus+OR+autonomous+shuttle+transit&hl=en-US&gl=US&ceid=US:en",
        "category_id": "autonomous"
    },
    {
        "name": "Google News: Hydrogen Bus",
        "url": "https://news.google.com/rss/search?q=hydrogen+fuel+cell+bus+OR+H2+bus+transit&hl=en-US&gl=US&ceid=US:en",
        "category_id": "hydrogen"
    },
    {
        "name": "Google News: Asia E-Buses",
        "url": "https://news.google.com/rss/search?q=electric+bus+Vietnam+OR+VinFast+bus+OR+BYD+bus+OR+Yutong+bus&hl=en-US&gl=US&ceid=US:en",
        "category_id": "electric"
    }
]

def clean_html(text):
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = html.unescape(text)
    return re.sub(r'\s+', ' ', text).strip()

def detect_category(title, desc, default_id):
    content = f"{title} {desc}".lower()
    if re.search(r'autonomous|driverless|self-driving|lidar|robo-bus|shuttle|level 4|av ', content):
        return "autonomous", "Autonomous & AI", "Xe Tự Hành & AI", "purple"
    if re.search(r'hydrogen|fuel cell|fuel-cell|ballard|caetano|h2 bus', content):
        return "hydrogen", "Hydrogen & Fuel Cell", "Hydro & Pin Nhiên Liệu", "sky"
    if re.search(r'its|telematics|fleet management|ticketing|v2x|iot|software|dispatch', content):
        return "its", "Fleet & ITS Tech", "Quản Lý Đội Xe & ITS", "amber"
    if re.search(r'tender|contract|order|procurement|delivery|funding|subsidy|invest', content):
        return "market", "Market & Tenders", "Thị Trường & Dự Án", "blue"
    return "electric", "Electric & E-Bus", "Xe Buýt Điện", "emerald"

def parse_date(date_str):
    if not date_str:
        return datetime.utcnow(), int(datetime.utcnow().timestamp())
    try:
        dt = parsedate_to_datetime(date_str)
        return dt, int(dt.timestamp())
    except Exception:
        dt = datetime.utcnow()
        return dt, int(dt.timestamp())

def fetch_feed(src):
    items = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        req = urllib.request.Request(src["url"], headers=headers)
        with urllib.request.urlopen(req, timeout=15) as res:
            content = res.read()
            root = ET.fromstring(content)
            for item in root.findall(".//item"):
                title = clean_html(item.findtext("title", ""))
                link = clean_html(item.findtext("link", "")).strip()
                pub_date = item.findtext("pubDate", "")
                desc = clean_html(item.findtext("description", ""))

                if not title or not link:
                    continue

                publisher = src["name"]
                if "Google News" in src["name"] and " - " in title:
                    parts = title.rsplit(" - ", 1)
                    title = parts[0].strip()
                    publisher = parts[1].strip()

                cat_id, cat_en, cat_vi, color = detect_category(title, desc, src["category_id"])
                dt, ts = parse_date(pub_date)

                snippet = desc[:280] + "..." if len(desc) > 280 else desc

                items.append({
                    "title": title,
                    "link": link,
                    "source": publisher,
                    "pub_date": dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "pub_timestamp": ts,
                    "description": snippet,
                    "image": "",
                    "category": cat_en,
                    "category_vi": cat_vi,
                    "category_id": cat_id,
                    "badge_color": color
                })
        print(f"[+] Loaded {len(items)} items from {src['name']}")
    except Exception as e:
        print(f"[-] Error loading {src['name']}: {e}")
    return items

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "data")
    os.makedirs(output_dir, exist_ok=True)

    all_articles = []
    seen_links = set()
    seen_titles = set()

    for src in SOURCES:
        feed_items = fetch_feed(src)
        for item in feed_items:
            norm_title = re.sub(r'[^a-zA-Z0-9]', '', item["title"].lower())
            if item["link"] in seen_links or (len(norm_title) > 20 and norm_title in seen_titles):
                continue
            seen_links.add(item["link"])
            seen_titles.add(norm_title)
            all_articles.append(item)

    all_articles.sort(key=lambda x: x["pub_timestamp"], reverse=True)
    top_articles = all_articles[:80]

    stats = {
        "total": len(top_articles),
        "electric": sum(1 for a in top_articles if a["category_id"] == "electric"),
        "autonomous": sum(1 for a in top_articles if a["category_id"] == "autonomous"),
        "hydrogen": sum(1 for a in top_articles if a["category_id"] == "hydrogen"),
        "its": sum(1 for a in top_articles if a["category_id"] == "its"),
        "market": sum(1 for a in top_articles if a["category_id"] == "market")
    }

    payload = {
        "metadata": {
            "last_updated": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "total_articles": len(top_articles),
            "sources_count": len(SOURCES),
            "stats": stats
        },
        "articles": top_articles
    }

    out_file = os.path.join(output_dir, "news.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    out_js = os.path.join(output_dir, "news.js")
    with open(out_js, "w", encoding="utf-8") as f:
        f.write("window.__BUS_NEWS_DATA__ = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n")

    print(f"\n[DONE] Saved {len(top_articles)} articles to {out_file} and {out_js}")

if __name__ == "__main__":
    main()
