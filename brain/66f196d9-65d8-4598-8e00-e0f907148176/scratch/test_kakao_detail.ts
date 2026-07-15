async function test() {
  const placeId = "1107405350" // "부엉이산장 광주용봉동점"
  
  try {
    console.log("Step 1: Fetching main place page to obtain session cookies...")
    const initRes = await fetch(`https://place.map.kakao.com/${placeId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    // Extract cookies from response headers
    const setCookies = initRes.headers.getSetCookie()
    console.log("Obtained Cookies count:", setCookies.length)
    
    // Parse cookies into a request-compatible string
    const cookieHeader = setCookies.map(cookie => cookie.split(';')[0]).join('; ')
    console.log("Cookie header payload:", cookieHeader)
    
    console.log("\nStep 2: Fetching details API with obtained cookies and full browser headers...")
    const res = await fetch(`https://place.map.kakao.com/main/v/${placeId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': `https://place.map.kakao.com/${placeId}`,
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookieHeader
      }
    })
    
    console.log("Details API Status Code:", res.status)
    if (res.ok) {
      const data = await res.json()
      console.log("✅ SUCCESS! JSON successfully retrieved via Cookie Session bypass!")
      if (data.menuInfo) {
        console.log("MenuList length:", data.menuInfo.menuList?.length)
        console.log("MenuList sample:", data.menuInfo.menuList?.slice(0, 3))
      }
    } else {
      console.log("Failed details body:", await res.text())
    }
  } catch (err: any) {
    console.error("Session fetch exception:", err.message || err)
  }
}
test()
