# Global Bus Tech News Aggregator for Windows PowerShell
$ErrorActionPreference = "SilentlyContinue"

$OutputDir = Join-Path $PSScriptRoot "data"
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$Sources = @(
    @{
        Name = "Sustainable Bus"
        Url = "https://www.sustainable-bus.com/feed/"
        Category = "Electric & E-Bus"
        CategoryVi = "Xe Buyt Dien"
        Color = "emerald"
    },
    @{
        Name = "Intelligent Transport"
        Url = "https://www.intelligenttransport.com/feed/"
        Category = "Fleet & ITS Tech"
        CategoryVi = "Quan Ly Doi Xe & ITS"
        Color = "amber"
    },
    @{
        Name = "Google News: Bus Technology"
        Url = "https://news.google.com/rss/search?q=electric+bus+OR+autonomous+bus+OR+smart+transit+bus+technology&hl=en-US&gl=US&ceid=US:en"
        Category = "Industry & Global Tenders"
        CategoryVi = "Thi Truong & Du An"
        Color = "blue"
    },
    @{
        Name = "Google News: Autonomous Shuttles"
        Url = "https://news.google.com/rss/search?q=driverless+bus+OR+autonomous+shuttle+transit&hl=en-US&gl=US&ceid=US:en"
        Category = "Autonomous & AI"
        CategoryVi = "Xe Tu Hanh & AI"
        Color = "purple"
    },
    @{
        Name = "Google News: Hydrogen Bus"
        Url = "https://news.google.com/rss/search?q=hydrogen+fuel+cell+bus+OR+H2+bus+transit&hl=en-US&gl=US&ceid=US:en"
        Category = "Hydrogen & Fuel Cell"
        CategoryVi = "Hydro & Pin Nhien Lieu"
        Color = "sky"
    },
    @{
        Name = "Google News: Asia E-Buses"
        Url = "https://news.google.com/rss/search?q=electric+bus+Vietnam+OR+VinFast+bus+OR+BYD+bus+OR+Yutong+bus&hl=en-US&gl=US&ceid=US:en"
        Category = "Electric & E-Bus"
        CategoryVi = "Xe Buyt Dien Chau A"
        Color = "emerald"
    }
)

$Articles = @()
$Seen = @{}

Write-Host "Connecting to global bus technology RSS feeds..." -ForegroundColor Cyan

foreach ($src in $Sources) {
    Write-Host "-> Fetching: $($src.Name)" -ForegroundColor Yellow
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        $wc.Encoding = [System.Text.Encoding]::UTF8
        $xmlContent = $wc.DownloadString($src.Url)
        $wc.Dispose()

        $xml = [xml]$xmlContent
        $items = $xml.SelectNodes("//item")

        $count = 0
        foreach ($item in $items) {
            $tNode = $item.SelectSingleNode("title")
            $lNode = $item.SelectSingleNode("link")
            $dNode = $item.SelectSingleNode("pubDate")
            $descNode = $item.SelectSingleNode("description")

            if ($null -eq $tNode -or $null -eq $lNode) { continue }

            $title = [System.Text.RegularExpressions.Regex]::Replace($tNode.InnerText, "<[^>]+>", " ")
            $title = [System.Text.RegularExpressions.Regex]::Replace($title, "\s+", " ")
            $title = [System.Net.WebUtility]::HtmlDecode($title).Trim()
            $link = $lNode.InnerText.Trim()

            if ([string]::IsNullOrEmpty($title) -or [string]::IsNullOrEmpty($link)) { continue }
            if ($Seen.ContainsKey($link)) { continue }
            $Seen[$link] = $true

            $desc = ""
            if ($null -ne $descNode) {
                $desc = [System.Text.RegularExpressions.Regex]::Replace($descNode.InnerText, "<[^>]+>", " ")
                $desc = [System.Text.RegularExpressions.Regex]::Replace($desc, "\s+", " ")
                $desc = [System.Net.WebUtility]::HtmlDecode($desc).Trim()
                if ($desc.Length -gt 280) {
                    $desc = $desc.Substring(0, 280) + "..."
                }
            }

            # Category detection
            $textLower = ($title + " " + $desc).ToLower()
            $cat = "Electric & E-Bus"
            $catVi = "Xe Buýt Điện"
            $catId = "electric"
            $color = "emerald"

            if ($textLower -match "autonomous|driverless|self-driving|lidar|robo-bus|shuttle|level 4|av ") {
                $cat = "Autonomous & AI"
                $catVi = "Xe Tự Hành & AI"
                $catId = "autonomous"
                $color = "purple"
            }
            elseif ($textLower -match "hydrogen|fuel cell|fuel-cell|ballard|caetano|h2 bus") {
                $cat = "Hydrogen & Fuel Cell"
                $catVi = "Hydro & Pin Nhiên Liệu"
                $catId = "hydrogen"
                $color = "sky"
            }
            elseif ($textLower -match "its|telematics|fleet management|ticketing|v2x|iot|software|dispatch") {
                $cat = "Fleet & ITS Tech"
                $catVi = "Quản Lý Đội Xe & ITS"
                $catId = "its"
                $color = "amber"
            }
            elseif ($textLower -match "tender|contract|order|procurement|delivery|funding|subsidy|invest") {
                $cat = "Market & Tenders"
                $catVi = "Thị Trường & Dự Án"
                $catId = "market"
                $color = "blue"
            }

            $pubDateStr = ""
            $timestamp = [int64]0
            if ($null -ne $dNode -and -not [string]::IsNullOrEmpty($dNode.InnerText)) {
                $pubDateStr = $dNode.InnerText
                $dt = [DateTime]::UtcNow
                if ([DateTime]::TryParse($pubDateStr, [ref]$dt)) {
                    $pubDateStr = $dt.ToString("yyyy-MM-dd HH:mm:ss") + " UTC"
                    $timestamp = [int64]($dt.ToUniversalTime().Ticks / 10000000 - 62135596800)
                }
            }

            $img = ""
            $enclosure = $item.SelectSingleNode("enclosure")
            if ($null -ne $enclosure) {
                $img = $enclosure.GetAttribute("url")
            }

            $publisher = $src.Name
            if ($src.Name -like "Google News*") {
                $dashIndex = $title.LastIndexOf(" - ")
                if ($dashIndex -gt 0) {
                    $publisher = $title.Substring($dashIndex + 3).Trim()
                    $title = $title.Substring(0, $dashIndex).Trim()
                }
            }

            $Articles += [PSCustomObject]@{
                title = $title
                link = $link
                source = $publisher
                pub_date = $pubDateStr
                pub_timestamp = $timestamp
                description = $desc
                image = $img
                category = $cat
                category_vi = $catVi
                category_id = $catId
                badge_color = $color
            }
            $count++
        }
        Write-Host "  + Loaded $count articles from $($src.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ! Warning: $($src.Name) - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

$Sorted = $Articles | Sort-Object -Property pub_timestamp -Descending | Select-Object -First 80

$Stats = @{
    total = $Sorted.Count
    autonomous = ($Sorted | Where-Object { $_.category_id -eq 'autonomous' }).Count
    electric = ($Sorted | Where-Object { $_.category_id -eq 'electric' }).Count
    hydrogen = ($Sorted | Where-Object { $_.category_id -eq 'hydrogen' }).Count
    its = ($Sorted | Where-Object { $_.category_id -eq 'its' }).Count
    market = ($Sorted | Where-Object { $_.category_id -eq 'market' }).Count
}

$Output = [PSCustomObject]@{
    metadata = [PSCustomObject]@{
        last_updated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss") + " UTC"
        total_articles = $Sorted.Count
        sources_count = $Sources.Count
        stats = $Stats
    }
    articles = $Sorted
}

$JsonPath = Join-Path $OutputDir "news.json"
$JsPath = Join-Path $OutputDir "news.js"
$rawJson = $Output | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($JsonPath, $rawJson, (New-Object System.Text.UTF8Encoding($false)))
[System.IO.File]::WriteAllText($JsPath, ("window.__BUS_NEWS_DATA__ = " + $rawJson + ";"), (New-Object System.Text.UTF8Encoding($false)))

Write-Host " SUCCESS: Saved $($Sorted.Count) articles into $JsonPath and $JsPath" -ForegroundColor Green

