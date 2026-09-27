import { launch } from 'cloakbrowser';
import axios from 'axios';

async function getCloudflareCookies() {
  console.log('🔄 FlareSolverr로 Cloudflare 챌린지 해결 중...');
  
  try {
    const response = await axios.post('http://127.0.0.1:8191/v1', {
      cmd: 'request.get',
      url: 'https://www.gmarket.co.kr/',
      maxTimeout: 60000
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.status === 'ok') {
      const { cookies, userAgent } = response.data.solution;
      console.log('✅ Cloudflare 챌린지 해결 성공!');
      return { cookies, userAgent };
    } else {
      throw new Error('FlareSolverr 실패: ' + response.data.message);
    }
  } catch (error) {
    console.error('❌ FlareSolverr 요청 실패:', error.message);
    throw error;
  }
}

async function automateGmarket() {
  // 1단계: FlareSolverr로 Cloudflare 우회
  const { cookies, userAgent } = await getCloudflareCookies();

  console.log('🚀 CloakBrowser 실행 중...');
  
  const browser = await launch({
    headless: true,
    humanize: true,
  });

  // 2단계: [수정] BrowserContext를 먼저 생성하고 User-Agent 설정
  console.log('🍪 Cloudflare 쿠키 및 User-Agent 주입 중...');
  const context = await browser.newContext({
    userAgent: userAgent // FlareSolverr가 사용한 UA와 반드시 일치해야 함
  });

  // 3단계: [수정] Context에 쿠키 주입 (Page가 아닌 Context에!)
  const gmarketCookies = cookies.map((cookie: any) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain || '.gmarket.co.kr',
    path: cookie.path || '/',
    expires: cookie.expires || Math.floor(Date.now() / 1000) + 3600
  }));
  
  await context.addCookies(gmarketCookies);

  // 4단계: [수정] 쿠키가 주입된 Context에서 새 페이지(탭) 생성
  const page = await context.newPage();

  // 5단계: 이제 쿠키가 있으니 정상 페이지로 바로 접근 가능
  console.log('🌐 G마켓 접속 시도...');
  await page.goto('https://www.gmarket.co.kr/', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });

  // 화면 캡처로 확인
  await page.screenshot({ path: './gmarket_after_bypass.png', fullPage: true });
  console.log('📸 화면 캡처 완료: gmarket_after_bypass.png');

  const title = await page.title();
  console.log('✅ 현재 페이지 제목:', title);

  // 6단계: 자동화 수행
  await page.waitForTimeout(2000);
  const searchInput = await page.$('#query'); 
  
  if (searchInput) {
    console.log('✅ 검색창 발견, 자동화 입력 시작...');
    await searchInput.click();
    await searchInput.type('에어팟', { delay: 150 }); 
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(3000); 
    await page.screenshot({ path: './gmarket_search.png', fullPage: true });
    console.log(' 검색 자동화 성공!');
  } else {
    console.log('⚠️ 검색창을 찾지 못했습니다.');
  }

  await browser.close();
  console.log('🔚 브라우저 종료');
}

automateGmarket().catch(console.error);