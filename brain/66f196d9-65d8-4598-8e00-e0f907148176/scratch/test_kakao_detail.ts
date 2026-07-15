async function test() {
  const KAKAO_REST_API_KEY = 'aa4fc64f9dc721b724b5674f6cebdd6f'
  const placeId = "1107405350" // "부엉이산장 광주용봉동점" (CNU spot)
  
  try {
    const url = `https://place.map.kakao.com/${placeId}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    console.log("HTML Details Status Code:", res.status)
    if (res.ok) {
      const html = await res.text()
      console.log("Successfully fetched HTML page. Size:", html.length, "bytes")
      
      // Let's search for script variables or keys like "menuInfo" or "menuList" in the HTML string
      const hasMenuInfo = html.includes('menuInfo')
      const hasMenuList = html.includes('menuList')
      console.log("Includes 'menuInfo':", hasMenuInfo)
      console.log("Includes 'menuList':", hasMenuList)
      
      // Kakao detailed page often stringifies state data inside <script> blocks. Let's find script blocks.
      // Search for any structured pattern containing menu list
      if (html.includes('menuInfo')) {
        const startIdx = html.indexOf('menuInfo')
        console.log("Snippet near 'menuInfo':", html.substring(startIdx, startIdx + 800))
      }
    } else {
      console.log("HTML fetch failed. Body:", await res.text())
    }
  } catch (err: any) {
    console.error("Fetch Exception:", err.message || err)
  }
}
test()
