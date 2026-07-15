async function test() {
  const placeId = "1107405350" // "부엉이산장 광주용봉동점"
  const url = `https://place.map.kakao.com/main/v/${placeId}`
  
  try {
    const res = await fetch(url, {
      headers: {
        'Host': 'place.map.kakao.com',
        'Connection': 'keep-alive',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': `https://place.map.kakao.com/${placeId}`,
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    })
    
    console.log("Full Emulation Status Code:", res.status)
    if (res.ok) {
      const data = await res.json()
      console.log("JSON successfully retrieved via Full Emulation!")
      console.log("Keys:", Object.keys(data))
      if (data.menuInfo) {
        console.log("MenuList length:", data.menuInfo.menuList?.length)
        console.log("MenuList sample:", data.menuInfo.menuList?.slice(0, 3))
      }
    } else {
      console.log("Failed body:", await res.text())
    }
  } catch (err: any) {
    console.error("Fetch Exception:", err.message || err)
  }
}
test()
