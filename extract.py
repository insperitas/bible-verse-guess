

#!/usr/bin/env python3

# -*- coding: utf-8 -*-

"""

watchtower_to_csv.py -------------------- Extracts the December entries from the Watchtower Online Library, parses dates, introductory italic paragraphs, and scriptural references, looks up each citation in "The Bible in Living English", and writes everything to verses.csv. Requirements ------------ pip install requests beautifulsoup4 The script will download a plaintext copy of BLE (≈4 MB) the first time it runs and cache it as ble.txt in the same directory. """

import csv

import os

import re

import sys

from collections import defaultdict

from datetime import datetime

from pathlib import Path

import requests

from bs4 import BeautifulSoup

# ----------------------------------------------------------------------

# CONFIGURATION ---------------------------------------------------------

# ----------------------------------------------------------------------

# 1️⃣  Watchtower page(s) – change/add URLs if the month is split across pages.

WATCHTOWER_URLS = [

    # Example URL – replace with the exact page you need.

    "https://wol.jw.org/en/wol/d/r1/lp-e/202312"

]

# 2️⃣  Where to store the downloaded BLE text (plaintext version).

BLE_TEXT_URL = (

    "https://raw.githubusercontent.com/openscriptures/bible/master/ble.txt"

)

BLE_LOCAL_PATH = Path("ble.txt")

# 3️⃣  Output CSV file name.

OUTPUT_CSV = Path("verses.csv")

# ----------------------------------------------------------------------

# HELPER FUNCTIONS ------------------------------------------------------

# ----------------------------------------------------------------------

def download_ble():

    """Download BLE plaintext file if it does not already exist."""

    if BLE_LOCAL_PATH.is_file():

        print(f"[+] BLE text already cached at {BLE_LOCAL_PATH}")

        return

    print("[*] Downloading The Bible in Living English …")

    try:

        r = requests.get(BLE_TEXT_URL, timeout=30)

        r.raise_for_status()

        BLE_LOCAL_PATH.write_bytes(r.content)

        print(f"[+] Saved BLE text to {BLE_LOCAL_PATH}")

    except Exception as exc:

        sys.exit(f"[!] Failed to download BLE text: {exc}")

def load_ble():

    """

 Load BLE into a dict: {(book, chapter): [(verse_number, verse_text), ...], ...}     """

    bible = defaultdict(list)

    verse_re = re.compile(r"^([\dA-Za-z ]+?)\s+(\d+):(\d+)\s+(.*)")

    with BLE_LOCAL_PATH.open(encoding="utf-8") as f:

        for line in f:

            line = line.strip()

            if not line:

                continue

            m = verse_re.match(line)

            if not m:

                continue

            book, chapter, verse, text = m.groups()

            bible[(book.strip(), int(chapter))].append((int(verse), text.strip()))

    print(f"[+] Loaded {len(bible)} chapters from BLE")

    return bible

def fetch_watchtower_page(url):

    """Retrieve a single Watchtower page."""

    try:

        resp = requests.get(url, timeout=30)

        resp.raise_for_status()

        return resp.text

    except Exception as exc:

        sys.exit(f"[!] Could not fetch {url}: {exc}")

def parse_entries(html):

    """

 Given the HTML of a Watchtower month page, return a list of dicts: { "raw_date": "...", "intro": "...", "reference": "Book Chapter:Verse[-Verse]" } Adjust the CSS selectors if the site layout changes.     """

    soup = BeautifulSoup(html, "html.parser")

    # The page groups each day's entry in an <article class="day-entry">.

    # If the actual class/tag differs, modify the selector below.

    entries = soup.select("article.day-entry")

    if not entries:

        # Fallback: look for generic sections that contain a date heading.

        entries = soup.select("section")  # very generic; may pick up extra nodes

    results = []

    for entry in entries:

        # ----- DATE -------------------------------------------------------

        # Typical heading tags: <h2>, <time>, or a span with class "date".

        date_tag = entry.find(["h2", "time", "span"], class_=re.compile("date", re.I))

        if not date_tag:

            # Try the first heading element as a last resort

            date_tag = entry.find(re.compile("^h[1-6]$"))

        raw_date = date_tag.get_text(strip=True) if date_tag else ""

        # ----- INTRODUCTORY ITALIC PARAGRAPH -----------------------------

        # Look for the first <p> that contains an <i> or <em>.

        italic_para = entry.find(

            lambda t: t.name == "p"

            and (t.find("i") or t.find("em"))

        )

        intro = italic_para.get_text(separator=" ", strip=True) if italic_para else ""

        # ----- SCRIPTURAL REFERENCE ---------------------------------------

        # The reference is usually something like "(John 3:16)" or "John 3:16".

        # We'll search the whole entry text for a pattern.

        full_text = entry.get_text(separator=" ", strip=True)

        ref_match = re.search(

            r"\b([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)\b", full_text

        )

        reference = ""

        if ref_match:

            book, chapter, verse = ref_match.groups()

            reference = f"{book.strip()} {chapter}:{verse}"

        else:

            # No reference found – leave empty.

            pass

        results.append(

            {

                "raw_date": raw_date,

                "intro": intro,

                "reference": reference,

            }

        )

    return results

def iso_from_raw(raw_date):

    """

 Convert a raw date string like "12 December 2023" to ISO YYYYMMDD. Supports a few common formats; extend as needed.     """

    # Remove any stray characters (commas, parentheses, etc.)

    cleaned = raw_date.replace(",", "").strip()

    # Try known patterns

    for fmt in ("%d %B %Y", "%B %d, %Y", "%d %b %Y"):

        try:

            dt = datetime.strptime(cleaned, fmt)

            return dt.date().isoformat()

        except ValueError:

            continue

    # If parsing fails, return empty string and let the caller decide.

    return ""

def lookup_ble(bible_dict, book, chapter, verse_range):

    """

 Return the verse text(s) from BLE for the given citation. verse_range may be a single number ("16") or a range ("16-18").     """

    key = (book, int(chapter))

    verses = bible_dict.get(key, [])

    if not verses:

        return ""

    # Normalise the range

    if "-" in verse_range:

        start, end = map(int, verse_range.split("-"))

        wanted = {v for v in range(start, end + 1)}

    else:

        wanted = {int(verse_range)}

    matched = [txt for num, txt in verses if num in wanted]

    return " ".join(matched)

def process_all():

    # --------------------------------------------------------------

    # 1️⃣  Ensure BLE is available and load it.

    # --------------------------------------------------------------

    download_ble()

    ble_dict = load_ble()

    # --------------------------------------------------------------

    # 2️⃣  Gather all entries from the Watchtower URLs.

    # --------------------------------------------------------------

    all_rows = []

    for url in WATCHTOWER_URLS:

        print(f"[*] Fetching Watchtower page: {url}")

        html = fetch_watchtower_page(url)

        entries = parse_entries(html)

        for ent in entries:

            iso_date = iso_from_raw(ent["raw_date"])

            if not iso_date:

                print(f"[!] Skipping entry with unparseable date: {ent['raw_date']}")

                continue

            # Split reference into components

            if ent["reference"]:

                ref_parts = re.match(

                    r"^([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)$", ent["reference"]

                )

                if ref_parts:

                    book, chapter, verse = ref_parts.groups()

                else:

                    book = chapter = verse = ""

            else:

                book = chapter = verse = ""

            # Look up BLE text (if we have a valid reference)

            ble_text = ""

            if book and chapter and verse:

                ble_text = lookup_ble(ble_dict, book, chapter, verse)

            row = {

                "date_iso": iso_date,

                "intro": ent["intro"],

                "book": book,

                "chapter": chapter,

                "verse": verse,

                "ble_text": ble_text,

            }

            all_rows.append(row)

    # --------------------------------------------------------------

    # 3️⃣  Write everything to verses.csv

    # --------------------------------------------------------------

    fieldnames = ["date_iso", "intro", "book", "chapter", "verse", "ble_text"]

    with OUTPUT_CSV.open(mode="w", newline="", encoding="utf-8") as f:

        writer = csv.DictWriter(f, fieldnames=fieldnames)

        writer.writeheader()

        writer.writerows(all_rows)

    print(f"[+] Finished! Wrote {len(all_rows)} rows to {OUTPUT_CSV}")

# ----------------------------------------------------------------------

# ENTRY POINT -----------------------------------------------------------

# ----------------------------------------------------------------------

if __name__ == "__main__":
    process_all()

