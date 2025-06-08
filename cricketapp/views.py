from django.shortcuts import render
from django.http import JsonResponse
import requests
from bs4 import BeautifulSoup
from duckduckgo_search.ddg import search as ddg_search


def home(request):
    return render(request, 'index.html')


def get_player(request, player_name):
    query = f"{player_name} cricbuzz"
    profile_link = None

    try:
        results = ddg_search(query, max_results=5)

        for r in results:
            if "cricbuzz.com/profiles/" in r['href']:
                profile_link = r['href']
                break
        if not profile_link:
            return JsonResponse({"error": "No player profile found"})
    except Exception as e:
        return JsonResponse({"error": f"Search failed: {str(e)}"})

    c = requests.get(profile_link).text
    cric = BeautifulSoup(c, "lxml")

    try:
        profile = cric.find("div", id="playerProfile")
        pc = profile.find("div", class_="cb-col cb-col-100 cb-bg-white")

        name = pc.find("h1", class_="cb-font-40").text
        country = pc.find("h3", class_="cb-font-18 text-gray").text
        image_url = pc.find("img")['src']

        personal = cric.find_all("div", class_="cb-col cb-col-60 cb-lst-itm-sm")
        role = personal[2].text.strip()

        icc = cric.find_all("div", class_="cb-col cb-col-25 cb-plyr-rank text-right")
        tb, ob, twb = icc[0].text.strip(), icc[1].text.strip(), icc[2].text.strip()
        tbw, obw, twbw = icc[3].text.strip(), icc[4].text.strip(), icc[5].text.strip()

        summary = cric.find_all("div", class_="cb-plyr-tbl")
        batting_stats, bowling_stats = {}, {}

        for row in summary[0].find("tbody").find_all("tr"):
            cols = row.find_all("td")
            format_name = cols[0].text.strip().lower()
            batting_stats[format_name] = {
                "matches": cols[1].text.strip(),
                "runs": cols[3].text.strip(),
                "highest_score": cols[5].text.strip(),
                "average": cols[6].text.strip(),
                "strike_rate": cols[7].text.strip(),
                "hundreds": cols[12].text.strip(),
                "fifties": cols[11].text.strip(),
            }

        for row in summary[1].find("tbody").find_all("tr"):
            cols = row.find_all("td")
            format_name = cols[0].text.strip().lower()
            bowling_stats[format_name] = {
                "balls": cols[3].text.strip(),
                "runs": cols[4].text.strip(),
                "wickets": cols[5].text.strip(),
                "best_bowling_innings": cols[9].text.strip(),
                "economy": cols[7].text.strip(),
                "five_wickets": cols[11].text.strip(),
            }

        player_data = {
            "name": name,
            "country": country,
            "image": image_url,
            "role": role,
            "rankings": {
                "batting": {"test": tb, "odi": ob, "t20": twb},
                "bowling": {"test": tbw, "odi": obw, "t20": twbw}
            },
            "batting_stats": batting_stats,
            "bowling_stats": bowling_stats
        }

        return JsonResponse(player_data)

    except Exception as e:
        return JsonResponse({"error": f"Error parsing player profile: {str(e)}"})


def schedule(request):
    link = "https://www.cricbuzz.com/cricket-schedule/upcoming-series/international"
    source = requests.get(link).text
    page = BeautifulSoup(source, "lxml")
    containers = page.find_all("div", class_="cb-col-100 cb-col")

    matches = []
    for container in containers:
        date = container.find("div", class_="cb-lv-grn-strip text-bold")
        info = container.find("div", class_="cb-col-100 cb-col")
        if date and info:
            matches.append(f"{date.text.strip()} - {info.text.strip()}")

    return JsonResponse(matches, safe=False)


def live_matches(request):
    link = "https://www.cricbuzz.com/cricket-match/live-scores"
    source = requests.get(link).text
    page = BeautifulSoup(source, "lxml")
    container = page.find("div", class_="cb-col cb-col-100 cb-bg-white")

    if not container:
        return JsonResponse([], safe=False)

    matches = container.find_all("div", class_="cb-scr-wll-chvrn cb-lv-scrs-col")
    return JsonResponse([m.text.strip() for m in matches], safe=False)
