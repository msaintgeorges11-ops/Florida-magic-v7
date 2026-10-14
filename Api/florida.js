// api/florida.js - ap chache rezilta chak minit
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  try {
    // Nou pran sou sous ki pibliye ofisyèl yo (proxy)
    const response = await fetch('https://www.flalottery.com/api/DrawGames?gameId=1001,1002', {
      headers: { 'User-Agent': 'Florida-Magic-V7' }
    });
    
    if (!response.ok) throw new Error('Source pa reponn');
    const data = await response.json();
    
    // Fòmate pou Pick 3 (1001) ak Pick 4 (1002)
    return res.status(200).json({ 
      success: true, 
      updated: new Date().toISOString(),
      data 
    });

  } catch (e) {
    // Si ofisyèl la bloke, nou voye dènye done nou genyen yo
    return res.status(200).json({ 
      success: false, 
      fallback: true,
      message: "Ap eseye ankò nan 1 minit"
    });
  }
  }
