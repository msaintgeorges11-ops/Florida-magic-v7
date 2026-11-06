/* Páginas de signos: bloque "tu signo astrológico hoy" (ES/FR/EN, misma fuente que la pestaña Astral: astral.json) + audio del día + audio del artículo */
(function(){
var D={"es":{"names":["Aries","Tauro","Géminis","Cáncer","Leo","Virgo","Libra","Escorpio","Sagitario","Capricornio","Acuario","Piscis"],"months":["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],"days":["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],"T":{"disc":"Solo para entretenimiento. Las posiciones de la Luna y los planetas se calculan para hoy; sus interpretaciones son tradicionales y no predicen nada. Los números son aleatorios."}},"fr":{"names":["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"],"months":["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],"days":["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],"T":{"disc":"Pour le divertissement uniquement. Les positions de la Lune et des planètes sont calculées pour aujourd’hui ; leurs interprétations sont traditionnelles et ne prédisent rien. Les numéros sont aléatoires."}},"en":{"names":["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"],"months":["January","February","March","April","May","June","July","August","September","October","November","December"],"days":["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],"T":{"disc":"For entertainment only. The positions of the Moon and planets are calculated for today; their interpretations are traditional and predict nothing. Numbers are random."}}};
var UI={
es:{t:function(n){return n+', tu signo astrológico hoy'},day:'Tu día',love:'Situación amorosa',lucky:'Número de la suerte de hoy',color:'Color',lis:'🔊 Escuchar mi día',art:'🔊 Escuchar el artículo',stop:'⏹ Parar',load:'Cargando tu texto de hoy…',noA:'Este dispositivo no soporta audio.',code:'es',sLucky:'Tu número de la suerte de hoy es el',sColor:'Tu color es',date:function(w,d,m,y){return w+' '+d+' de '+m+' de '+y}},
fr:{t:function(n){return n+', ton signe astrologique aujourd’hui'},day:'Ta journée',love:'Vie amoureuse',lucky:'Numéro chance du jour',color:'Couleur',lis:'🔊 Écouter ma journée',art:'🔊 Écouter l’article (en espagnol)',stop:'⏹ Arrêter',load:'Chargement de ton texte du jour…',noA:'Cet appareil ne prend pas en charge l’audio.',code:'fr',sLucky:'Ton numéro chance du jour est le',sColor:'Ta couleur est',date:function(w,d,m,y){return w+' '+d+' '+m+' '+y}},
en:{t:function(n){return n+', your zodiac sign today'},day:'Your day',love:'Love life',lucky:'Lucky number today',color:'Color',lis:'🔊 Listen to my day',art:'🔊 Listen to the article (in Spanish)',stop:'⏹ Stop',load:'Loading your text for today…',noA:'This device does not support audio.',code:'en',sLucky:'Your lucky number today is',sColor:'Your color is',date:function(w,d,m,y){return w+', '+m+' '+d+', '+y}}
};
var lang='es',cur=null,activeBtn=null,hasTTS='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
try{var sv=localStorage.getItem('lang');if(UI[sv])lang=sv}catch(e){}
var al=lang;
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function clean(t){return String(t).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u2B50\uFE0F\u00AD]/gu,'').replace(/\s+/g,' ').trim()}
/* ---- mismo cálculo que la pestaña Astral del index (copiado tal cual) ---- */
function etNow(){
  const o={};
  new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date()).forEach(p=>o[p.type]=+p.value);
  if(o.hour===24)o.hour=0;
  return o;
}
function textToSeed(t){let s=0;for(let i=0;i<t.length;i++)s+=t.charCodeAt(i)*(i+1)*9301;return s}
function seededRandom(s){const x=Math.sin(s)*10000;return x-Math.floor(x)}
const ETK=()=>{const o=etNow();return o.year+'-'+String(o.month).padStart(2,'0')+'-'+String(o.day).padStart(2,'0')};
let FIX={"date":"2026-10-16","signs":[{"num":17,"hex":"#e53935","fr":{"color":"le Rouge","day":"Ce vendredi apporte une énergie positive. Tu pourrais recevoir un message ou une nouvelle que tu attendais depuis quelque temps.","love":"Une personne pense beaucoup à toi. Si tu es en couple, un moment tendre pourrait vous rapprocher davantage. Si tu es célibataire, quelqu’un pourrait chercher à te parler ce soir."},"es":{"color":"Rojo","day":"Este viernes trae una energía positiva. Podrías recibir un mensaje o una noticia que esperabas desde hace algún tiempo.","love":"Una persona piensa mucho en ti. Si estás en pareja, un momento tierno podría acercarlos aún más. Si estás soltero o soltera, alguien podría querer hablar contigo esta noche."},"en":{"color":"Red","day":"This Friday brings positive energy. You could receive a message or news you have been waiting for some time.","love":"Someone is thinking about you a lot. If you are in a relationship, a tender moment could bring you even closer. If you are single, someone might want to talk to you tonight."}},{"num":24,"hex":"#2e9e4f","fr":{"color":"le Vert","day":"Aujourd’hui demande de la patience, mais une belle opportunité pourrait se présenter. Une personne pourrait t’apporter une bonne nouvelle concernant le travail ou l’argent.","love":"L’amour devient plus doux pour toi. Une petite conversation pourrait changer complètement l’ambiance entre toi et une personne que tu apprécies."},"es":{"color":"Verde","day":"Hoy requiere paciencia, pero una bonita oportunidad podría presentarse. Alguien podría traerte una buena noticia sobre el trabajo o el dinero.","love":"El amor se vuelve más dulce para ti. Una pequeña conversación podría cambiar por completo el ambiente entre tú y una persona que aprecias."},"en":{"color":"Green","day":"Today calls for patience, but a nice opportunity could come up. Someone could bring you good news about work or money.","love":"Love becomes sweeter for you. A small conversation could completely change the mood between you and someone you care about."}},{"num":11,"hex":"#f4c20d","fr":{"color":"le Jaune","day":"La communication est ta force aujourd’hui. Un appel, un message ou une conversation pourrait t’apporter une surprise positive.","love":"Une personne qui était silencieuse pourrait enfin reprendre contact avec toi. Si tu es en couple, des paroles tendres feront toute la différence."},"es":{"color":"Amarillo","day":"La comunicación es tu fuerza hoy. Una llamada, un mensaje o una conversación podría darte una sorpresa positiva.","love":"Una persona que estaba en silencio podría por fin retomar el contacto contigo. Si estás en pareja, las palabras tiernas marcarán toda la diferencia."},"en":{"color":"Yellow","day":"Communication is your strength today. A call, a message or a conversation could bring you a positive surprise.","love":"Someone who had gone quiet could finally get back in touch with you. If you are in a relationship, tender words will make all the difference."}},{"num":8,"hex":"#f5f5f5","fr":{"color":"le Blanc","day":"Ton intuition est très forte aujourd’hui. Fais confiance à ton ressenti, car tu pourrais remarquer quelque chose que les autres ne voient pas.","love":"Ton cœur pourrait ressentir un soulagement. Une personne pourrait te montrer qu’elle s’intéresse toujours à toi, même sans le dire directement."},"es":{"color":"Blanco","day":"Tu intuición está muy fuerte hoy. Confía en lo que sientes, porque podrías notar algo que los demás no ven.","love":"Tu corazón podría sentir alivio. Una persona podría mostrarte que todavía se interesa por ti, aunque no lo diga directamente."},"en":{"color":"White","day":"Your intuition is very strong today. Trust your feelings, because you might notice something others do not see.","love":"Your heart could feel relief. Someone could show you they are still interested in you, even without saying it directly."}},{"num":29,"hex":"#f57c00","fr":{"color":"l’Orange","day":"Tu recevras plus d’attention que d’habitude. Quelqu’un pourrait remarquer tes efforts et te féliciter pour ton travail.","love":"Un beau moment pourrait arriver sans que tu l’aies prévu. Si tu es célibataire, quelqu’un pourrait te faire un signe très facile à comprendre."},"es":{"color":"Naranja","day":"Recibirás más atención de lo habitual. Alguien podría notar tus esfuerzos y felicitarte por tu trabajo.","love":"Un momento bonito podría llegar sin que lo hayas previsto. Si estás soltero o soltera, alguien podría hacerte una señal muy fácil de entender."},"en":{"color":"Orange","day":"You will get more attention than usual. Someone could notice your efforts and congratulate you on your work.","love":"A lovely moment could arrive when you least expect it. If you are single, someone might give you a sign that is very easy to understand."}},{"num":16,"hex":"#1e66f5","fr":{"color":"le Bleu","day":"Une chose que tu pensais longue à réaliser pourrait enfin commencer à avancer. Ne te décourage pas si tout ne se passe pas exactement comme prévu.","love":"Un petit détail pourrait te faire comprendre les sentiments d’une personne. Si tu es en couple, une belle surprise pourrait t’attendre."},"es":{"color":"Azul","day":"Algo que creías que tardaría mucho podría por fin empezar a avanzar. No te desanimes si todo no sale exactamente como lo planeaste.","love":"Un pequeño detalle podría hacerte entender los sentimientos de una persona. Si estás en pareja, una bonita sorpresa podría estar esperándote."},"en":{"color":"Blue","day":"Something you thought would take a long time could finally start moving forward. Do not get discouraged if everything does not go exactly as planned.","love":"A small detail could help you understand someone's feelings. If you are in a relationship, a nice surprise could be waiting for you."}},{"num":33,"hex":"#e53935","fr":{"color":"le Rouge","day":"Le vendredi est une journée d’amour pour toi, Vénus brille sur ton chemin. Tu pourrais recevoir une bonne nouvelle au travail aujourd’hui.","love":"Une petite dispute pourrait se terminer par un gros baiser. Si tu es célibataire, quelqu’un pourrait t’écrire ce soir."},"es":{"color":"Rojo","day":"El viernes es un día de amor para ti, Venus brilla en tu camino. Hoy podrías recibir una buena noticia en el trabajo.","love":"Una pequeña discusión podría terminar con un gran beso. Si estás soltero o soltera, alguien podría escribirte esta noche."},"en":{"color":"Red","day":"Friday is a day of love for you, Venus shines on your path. You could receive good news at work today.","love":"A small argument could end with a big kiss. If you are single, someone could write to you tonight."}},{"num":13,"hex":"#111111","fr":{"color":"le Noir","day":"Aujourd’hui apporte une énergie de changement. Une décision que tu prendras pourrait ouvrir une nouvelle porte pour toi.","love":"Une personne pourrait te faire une confession ou te montrer un sentiment qu’elle cachait. Ne te précipite pas, prends le temps de comprendre la situation."},"es":{"color":"Negro","day":"Hoy trae una energía de cambio. Una decisión que tomes podría abrirte una nueva puerta.","love":"Una persona podría hacerte una confesión o mostrarte un sentimiento que escondía. No te apresures, tómate el tiempo de entender la situación."},"en":{"color":"Black","day":"Today brings an energy of change. A decision you make could open a new door for you.","love":"Someone could make a confession or show you a feeling they were hiding. Do not rush, take the time to understand the situation."}},{"num":21,"hex":"#8e44ad","fr":{"color":"le Violet","day":"Une bonne énergie et du mouvement t’accompagnent aujourd’hui. Une nouvelle pourrait te donner envie de commencer un nouveau projet ou de changer quelque chose dans ta vie.","love":"Quelqu’un pourrait te faire rire aujourd’hui. Si tu es célibataire, une nouvelle rencontre pourrait devenir très intéressante."},"es":{"color":"Morado","day":"Una buena energía y movimiento te acompañan hoy. Una noticia podría darte ganas de empezar un nuevo proyecto o de cambiar algo en tu vida.","love":"Alguien podría hacerte reír hoy. Si estás soltero o soltera, un nuevo encuentro podría volverse muy interesante."},"en":{"color":"Purple","day":"Good energy and movement are with you today. A piece of news could make you want to start a new project or change something in your life.","love":"Someone could make you laugh today. If you are single, a new meeting could become very interesting."}},{"num":6,"hex":"#888888","fr":{"color":"le Gris","day":"Ton travail et tes efforts commencent à porter leurs fruits. Une personne pourrait reconnaître ta valeur ou t’offrir une opportunité.","love":"Ne laisse pas le silence te tromper. Une personne pourrait avoir des sentiments pour toi sans être encore prête à les exprimer."},"es":{"color":"Gris","day":"Tu trabajo y tus esfuerzos empiezan a dar frutos. Una persona podría reconocer tu valor u ofrecerte una oportunidad.","love":"No dejes que el silencio te engañe. Una persona podría tener sentimientos por ti sin estar todavía lista para expresarlos."},"en":{"color":"Gray","day":"Your work and efforts are starting to bear fruit. Someone could recognize your value or offer you an opportunity.","love":"Do not let silence fool you. Someone could have feelings for you without being ready to express them yet."}},{"num":32,"hex":"#6ec1ff","fr":{"color":"le Bleu clair","day":"Une idée que tu as aujourd’hui pourrait devenir très utile plus tard. Ne néglige pas une opportunité qui se présente soudainement.","love":"Un message inattendu pourrait te faire plaisir. Si tu es en couple, une petite sortie ensemble pourrait vous rapprocher."},"es":{"color":"Azul claro","day":"Una idea que tengas hoy podría resultar muy útil más adelante. No descuides una oportunidad que se presente de repente.","love":"Un mensaje inesperado podría alegrarte. Si estás en pareja, una pequeña salida juntos podría acercarlos."},"en":{"color":"Light blue","day":"An idea you have today could become very useful later. Do not neglect an opportunity that suddenly shows up.","love":"An unexpected message could make you happy. If you are in a relationship, a little outing together could bring you closer."}},{"num":9,"hex":"#ec6fa5","fr":{"color":"le Rose","day":"Ce vendredi apporte une énergie positive pour toi. Une nouvelle inattendue pourrait te rendre plus calme et plus confiant.","love":"Ton cœur pourrait recevoir une belle surprise. Une personne éloignée pourrait chercher à se rapprocher de nouveau. Si tu es célibataire, la soirée pourrait apporter une nouvelle conversation intéressante."},"es":{"color":"Rosado","day":"Este viernes trae una energía positiva para ti. Una noticia inesperada podría hacerte sentir más tranquilo o tranquila y con más confianza.","love":"Tu corazón podría recibir una bonita sorpresa. Una persona lejana podría querer acercarse de nuevo. Si estás soltero o soltera, la noche podría traer una conversación interesante."},"en":{"color":"Pink","day":"This Friday brings positive energy for you. An unexpected piece of news could make you calmer and more confident.","love":"Your heart could receive a lovely surprise. Someone far away could try to come closer again. If you are single, the evening could bring an interesting new conversation."}}]};
const POOL=JSON.parse(JSON.stringify(FIX));
const OP={
fr:['Ce dimanche invite au repos et à la joie, le Soleil éclaire ta journée.','Ce lundi apporte un nouveau départ, la Lune adoucit ton chemin.','Ce mardi donne de l’énergie et du courage, Mars t’accompagne.','Ce mercredi favorise les conversations et les idées, Mercure t’inspire.','Ce jeudi apporte de la confiance, Jupiter veille sur toi.','Ce vendredi est une journée d’amour, Vénus brille sur ton chemin.','Ce samedi invite à la patience et à la sérénité, Saturne te protège.'],
es:['Este domingo invita al descanso y la alegría, el Sol ilumina tu día.','Este lunes trae un nuevo comienzo, la Luna suaviza tu camino.','Este martes da energía y valentía, Marte te acompaña.','Este miércoles favorece las conversaciones y las ideas, Mercurio te inspira.','Este jueves trae confianza, Júpiter vela por ti.','Este viernes es un día de amor, Venus brilla en tu camino.','Este sábado invita a la paciencia y la serenidad, Saturno te protege.'],
en:['This Sunday invites rest and joy, the Sun lights up your day.','This Monday brings a fresh start, the Moon softens your path.','This Tuesday gives energy and courage, Mars is with you.','This Wednesday favors conversations and ideas, Mercury inspires you.','This Thursday brings confidence, Jupiter watches over you.','This Friday is a day of love, Venus shines on your path.','This Saturday invites patience and calm, Saturn protects you.']};
const COL={hex:['#e53935','#2e9e4f','#f4c20d','#f5f5f5','#f57c00','#1e66f5','#111111','#8e44ad','#888888','#6ec1ff','#ec6fa5'],
fr:['le Rouge','le Vert','le Jaune','le Blanc','l’Orange','le Bleu','le Noir','le Violet','le Gris','le Bleu clair','le Rose'],
es:['Rojo','Verde','Amarillo','Blanco','Naranja','Azul','Negro','Morado','Gris','Azul claro','Rosado'],
en:['Red','Green','Yellow','White','Orange','Blue','Black','Purple','Gray','Light blue','Pink']};
function line(i,k){const t=POOL.signs[i][al][k],p=t.match(/[^.!?]+[.!?]+\s*/g)||[t];
  if(p.length>1&&/vendredi|viernes|friday/i.test(p[0]))p.shift();return p.join('').trim()}
// ---- Ciel réel : positions calculées (Soleil, Lune, Vénus, Mercure) ----
const EPH=(()=>{
  const R=Math.PI/180,mod=x=>((x%360)+360)%360,sin=x=>Math.sin(x*R),cos=x=>Math.cos(x*R);
  const jd=d=>d.getTime()/864e5+2440587.5;
  const cent=d=>(jd(d)-2451545)/36525;
  function sun(T){
    const L0=280.46646+36000.76983*T+0.0003032*T*T,M=357.52911+35999.05029*T-0.0001537*T*T;
    const C=(1.914602-0.004817*T-0.000014*T*T)*sin(M)+(0.019993-0.000101*T)*sin(2*M)+0.000289*sin(3*M);
    const e=0.016708634-0.000042037*T,nu=M+C,Rr=1.000001018*(1-e*e)/(1+e*cos(nu));
    return{lon:mod(L0+C-0.00569-0.00478*sin(125.04-1934.136*T)),trueLon:mod(L0+C),r:Rr};
  }
  const MT=[[0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110]];
  function moon(T){
    const Lp=218.3164477+481267.88123421*T-0.0015786*T*T,D=297.8501921+445267.1114034*T-0.0018819*T*T,
      M=357.5291092+35999.0502909*T-0.0001536*T*T,Mp=134.9633964+477198.8675055*T+0.0087414*T*T,
      F=93.272095+483202.0175233*T-0.0036539*T*T,E=1-0.002516*T-0.0000074*T*T;
    let s=0;
    MT.forEach(t=>{const f=Math.abs(t[1])===1?E:(Math.abs(t[1])===2?E*E:1);s+=t[4]*f*sin(t[0]*D+t[1]*M+t[2]*Mp+t[3]*F)});
    s+=3958*sin(119.75+131.849*T)+1962*sin(Lp-F)+318*sin(53.09+479264.29*T);
    const dpsi=-0.00478*sin(125.04-1934.136*T); // nutation approx.
    return mod(Lp+s/1e6+dpsi);
  }
  const EL={ // éléments képlériens J2000 + variation par siècle (a,e,I,L,peri,noeud)
    Mercury:[[0.38709927,0.00000037],[0.20563593,0.00001906],[7.00497902,-0.00594749],[252.2503235,149472.67411175],[77.45779628,0.16047689],[48.33076593,-0.12534081]],
    Venus:[[0.72333566,0.0000039],[0.00677672,-0.00004107],[3.39467605,-0.0007889],[181.9790995,58517.81538729],[131.60246718,0.00268329],[76.67984255,-0.27769418]],
    Earth:[[1.00000261,0.00000562],[0.01671123,-0.00004392],[-0.00001531,-0.01294668],[100.46457166,35999.37244981],[102.93768193,0.32327364],[0,0]]
  };
  function helio(n,T){
    const p=EL[n].map(x=>x[0]+x[1]*T),a=p[0],e=p[1],I=p[2],L=p[3],w=p[4],O=p[5];
    const om=w-O,M=mod(L-w);let E=M*R+e*Math.sin(M*R);
    for(let k=0;k<12;k++)E=E+(M*R-(E-e*Math.sin(E))) /(1-e*Math.cos(E));
    const xp=a*(Math.cos(E)-e),yp=a*Math.sqrt(1-e*e)*Math.sin(E);
    return{x:(cos(om)*cos(O)-sin(om)*sin(O)*cos(I))*xp+(-sin(om)*cos(O)-cos(om)*sin(O)*cos(I))*yp,
           y:(cos(om)*sin(O)+sin(om)*cos(O)*cos(I))*xp+(-sin(om)*sin(O)+cos(om)*cos(O)*cos(I))*yp};
  }
  function planet(n,T){ // longitude géocentrique écliptique (équinoxe de la date)
    const p=helio(n,T),e=helio('Earth',T);
    return mod(Math.atan2(p.y-e.y,p.x-e.x)/R+1.39697*T);
  }
  function at(d){
    const T=cent(d),T2=cent(new Date(d.getTime()+864e5)),s=sun(T).lon,m=moon(T);
    let dm=planet('Mercury',T2)-planet('Mercury',T);if(dm>180)dm-=360;if(dm<-180)dm+=360;
    return{sun:s,moon:m,venus:planet('Venus',T),mercury:planet('Mercury',T),mercRetro:dm<0,elong:mod(m-s)};
  }
  return{at,sun:d=>sun(cent(d)).lon,moon:d=>moon(cent(d)),planet:(n,d)=>planet(n,cent(d))};
})();

const SKYT={
fr:{ph:['Nouvelle Lune','croissante','premier quartier','gibbeuse croissante','Pleine Lune','gibbeuse décroissante','dernier quartier','décroissante'],in:'en',dir:'direct',ret:'rétrograde',
 moon:n=>`La Lune est en ${n}`,venus:n=>`Vénus est en ${n}`,
 mAsp:{c:'La Lune est dans ton signe : tes émotions sont plus fortes, écoute-toi.',t:'La Lune est en harmonie (trigone) avec ton signe : tout coule plus facilement, bon moment pour avancer.',s:'La Lune forme un sextile avec ton signe : de petites occasions favorables s’ouvrent à toi.',q:'La Lune forme un carré avec ton signe : un peu de tension, mais elle te pousse à agir. Garde ton calme.',o:'La Lune est en face de ton signe : tu peux ressentir un tiraillement, cherche l’équilibre avec les autres.',n:'La Lune reste discrète avec ton signe : journée tranquille, suis ton rythme.'},
 vAsp:{c:'Vénus est dans ton signe : ton charme est à son maximum.',t:'Vénus est en harmonie avec ton signe : l’amour et l’amitié coulent facilement.',s:'Vénus te fait un clin d’œil : une petite occasion de rapprochement.',q:'Vénus frotte un peu ton signe : de petits malentendus sont possibles, parle avec douceur.',o:'Vénus est en face de ton signe : l’autre t’attire, mais garde ta liberté.',n:'Vénus reste discrète : l’amour avance doucement.'},
 retro:'Mercure est rétrograde : relis, vérifie et prends ton temps avant de signer ou d’envoyer un message important.'},
es:{ph:['Luna nueva','creciente','cuarto creciente','gibosa creciente','Luna llena','gibosa menguante','cuarto menguante','menguante'],in:'en',dir:'directo',ret:'retrógrado',
 moon:n=>`La Luna está en ${n}`,venus:n=>`Venus está en ${n}`,
 mAsp:{c:'La Luna está en tu signo: tus emociones son más fuertes, escúchate.',t:'La Luna está en armonía (trígono) con tu signo: todo fluye con más facilidad, buen momento para avanzar.',s:'La Luna forma un sextil con tu signo: se abren pequeñas oportunidades favorables.',q:'La Luna forma una cuadratura con tu signo: algo de tensión, pero te empuja a actuar. Mantén la calma.',o:'La Luna está frente a tu signo: puedes sentir un tironeo, busca el equilibrio con los demás.',n:'La Luna es discreta con tu signo: día tranquilo, sigue tu ritmo.'},
 vAsp:{c:'Venus está en tu signo: tu encanto está al máximo.',t:'Venus está en armonía con tu signo: el amor y la amistad fluyen con facilidad.',s:'Venus te guiña el ojo: una pequeña oportunidad de acercamiento.',q:'Venus roza un poco tu signo: son posibles pequeños malentendidos, habla con suavidad.',o:'Venus está frente a tu signo: el otro te atrae, pero conserva tu libertad.',n:'Venus es discreta: el amor avanza despacio.'},
 retro:'Mercurio está retrógrado: relee, verifica y tómate tu tiempo antes de firmar o enviar un mensaje importante.'},
en:{ph:['New Moon','waxing crescent','first quarter','waxing gibbous','Full Moon','waning gibbous','last quarter','waning crescent'],in:'in',dir:'direct',ret:'retrograde',
 moon:n=>`The Moon is in ${n}`,venus:n=>`Venus is in ${n}`,
 mAsp:{c:'The Moon is in your sign: your emotions run stronger, listen to yourself.',t:'The Moon is in harmony (trine) with your sign: things flow more easily, a good time to move forward.',s:'The Moon forms a sextile with your sign: small favorable chances open up for you.',q:'The Moon forms a square with your sign: a little tension, but it pushes you to act. Stay calm.',o:'The Moon is opposite your sign: you may feel a tug-of-war, look for balance with others.',n:'The Moon is quiet with your sign: a calm day, follow your own pace.'},
 vAsp:{c:'Venus is in your sign: your charm is at its peak.',t:'Venus is in harmony with your sign: love and friendship flow easily.',s:'Venus winks at you: a small chance to get closer.',q:'Venus rubs your sign a little: small misunderstandings are possible, speak gently.',o:'Venus is opposite your sign: the other draws you in, but keep your freedom.',n:'Venus stays quiet: love moves slowly.'},
 retro:'Mercury is retrograde: re-read, double-check and take your time before signing or sending an important message.'}
};
let SKYC=null;
function skyNow(){
  const k=ETK();if(SKYC&&SKYC.k===k)return SKYC;
  const o=etNow(),r=EPH.at(new Date(Date.UTC(o.year,o.month-1,o.day,16,0)));
  const sg=l=>Math.floor(l/30)%12,e=r.elong,ph=Math.floor(((e+22.5)%360)/45);
  SKYC={k,moon:sg(r.moon),venus:sg(r.venus),retro:r.mercRetro,ph};return SKYC;
}
function aspKey(a,b){const d=((a-b)%12+12)%12;return d===0?'c':(d===4||d===8)?'t':(d===2||d===10)?'s':(d===3||d===9)?'q':d===6?'o':'n'}
function skyText(i){
  try{
    const k=SKYT[al],n=D[al].names,x=skyNow();
    return{
      bar:'🌙 '+({fr:'Lune',es:'Luna',en:'Moon'}[al])+' '+k.in+' '+n[x.moon]+' ('+k.ph[x.ph]+') · ♀ '+({fr:'Vénus',es:'Venus',en:'Venus'}[al])+' '+k.in+' '+n[x.venus]+' · ☿ '+({fr:'Mercure',es:'Mercurio',en:'Mercury'}[al])+' '+(x.retro?k.ret:k.dir),
      day:k.moon(n[x.moon])+' ('+k.ph[x.ph]+'). '+k.mAsp[aspKey(x.moon,i)]+(x.retro?' '+k.retro:''),
      love:k.venus(n[x.venus])+'. '+k.vAsp[aspKey(x.venus,i)]
    };
  }catch(e){return null}
}
function weekly(i,wd){
  const dk=ETK(),r=k=>seededRandom(textToSeed(dk+'_wk_'+k));
  const a=Math.floor(r('a')*12),b=(a+1+Math.floor(r('b')*11))%12,nums=[];
  for(let n=1;n<=36;n++)nums.push(n);
  for(let j=35;j>0;j--){const k=Math.floor(r('s'+j)*(j+1));const x=nums[j];nums[j]=nums[k];nums[k]=x}
  const c=(i+Math.floor(r('c')*11))%11;
  return{num:nums[i],hex:COL.hex[c],color:COL[al][c],day:OP[al][wd]+' '+line((i+a)%12,'day'),love:line((i+b)%12,'love')};
}
/* ---- fin ---- */
function reading(i){
  var o=etNow(),wd=new Date(Date.UTC(o.year,o.month-1,o.day,12)).getUTCDay(),num,hex,color,dt,lt;
  var sg=FIX&&FIX.date===ETK()&&FIX.signs&&FIX.signs[i],f=sg&&sg[al];
  if(f){num=sg.num;color=f.color;hex=sg.hex||'#1363f8';dt=f.day;lt=f.love}
  else{var w=weekly(i,wd);num=w.num;color=w.color;hex=w.hex;dt=w.day;lt=w.love}
  var sk=skyText(i);if(sk){dt=dt+' '+sk.day;lt=lt+' '+sk.love}
  return{num:num,hex:hex,color:color,day:dt,love:lt,o:o,wd:wd};
}
function render(){
  var box=document.getElementById('hoy');if(!box)return;
  al=lang;
  var i=+box.getAttribute('data-sign'),u=UI[lang],d=D[lang],r=reading(i),
  dt=u.date(d.days[r.wd],r.o.day,d.months[r.o.month-1],r.o.year);
  cur={speech:u.t(d.names[i])+'. '+dt+'. '+u.day+': '+r.day+' '+u.love+': '+r.love+' '+u.sLucky+' '+r.num+'. '+u.sColor+' '+r.color+'.'};
  box.innerHTML='<h2>✨ '+esc(u.t(d.names[i]))+'</h2>'+
  '<p><button class="aud" id="audDay">'+u.lis+'</button></p>'+
  '<p>📅 <b>'+esc(dt)+'</b></p>'+
  '<p>📅 <b>'+u.day+':</b> '+esc(r.day)+'</p>'+
  '<p>❤️ <b>'+u.love+':</b> '+esc(r.love)+'</p>'+
  '<p>🍀 <b>'+u.lucky+':</b> '+r.num+'</p>'+
  '<p>🎨 <b>'+u.color+':</b> <span style="display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;border:1px solid #999;background:'+r.hex+'"></span> '+esc(r.color)+'</p>'+
  '<p style="font-size:12px;color:#555">'+esc(d.T.disc)+'</p>';
  var b=document.getElementById('audDay');if(b)b.onclick=function(){speak(b,cur.speech,lang,u.lis)};
  var a=document.getElementById('audArt');if(a){a.textContent=u.art;a.onclick=function(){var el=document.getElementById('art');speak(a,el?el.innerText:'','es',u.art)}}
  var L=document.querySelectorAll('#lg button');for(var j=0;j<L.length;j++)L[j].className=L[j].getAttribute('data-l')===lang?'on':'';
}
function score(v){var n=v.name||'',x=0;
  if(/natural|neural|online|wavenet|network/i.test(n))x+=6;if(/premium|enhanced|siri/i.test(n))x+=5;if(/google/i.test(n))x+=3;
  if(/compact|espeak/i.test(n))x-=3;if(v.localService===false)x+=1;return x}
function voice(l){
  var vs=(speechSynthesis.getVoices()||[]).filter(function(v){return v.lang&&v.lang.replace('_','-').toLowerCase().indexOf(l)===0});
  try{var sv=localStorage.getItem('astVoice_'+l);if(sv){var m=vs.filter(function(v){return v.name===sv})[0];if(m)return m}}catch(e){}
  vs.sort(function(a,b){return score(b)-score(a)});return vs[0]||null;
}
function stopAudio(){
  if(!hasTTS)return;speechSynthesis.cancel();
  if(activeBtn){activeBtn.textContent=activeBtn._label;activeBtn=null}
}
function speak(btn,text,l,label){
  if(!hasTTS){alert(UI[lang].noA);return}
  if(activeBtn===btn){stopAudio();return}
  stopAudio();
  var parts=clean(text).match(/[^.!?:]+[.!?:]*/g)||[];if(!parts.length)return;
  var v=voice(l);btn._label=label;btn.textContent=UI[lang].stop;activeBtn=btn;
  setTimeout(function(){
    parts.forEach(function(s,idx){
      var u=new SpeechSynthesisUtterance(s.trim());
      u.lang=v?v.lang:({es:'es-ES',fr:'fr-FR',en:'en-US'})[l];if(v)u.voice=v;u.rate=.9;u.pitch=1.05;
      if(idx===parts.length-1)u.onend=u.onerror=function(){if(activeBtn===btn){btn.textContent=btn._label;activeBtn=null}};
      speechSynthesis.speak(u);
    });
  },60);
}
function setLang(l){
  lang=l;try{localStorage.setItem('lang',l)}catch(e){}
  stopAudio();render();
}
function run(){
  var box=document.getElementById('hoy');if(!box)return;
  render();
  fetch('/astral.json?'+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(d){
    if(d&&d.date&&Array.isArray(d.signs)&&d.signs.length===12){FIX=d;if(!activeBtn)render()}
  }).catch(function(){});
}
var L=document.querySelectorAll('#lg button');
for(var j=0;j<L.length;j++)(function(b){b.onclick=function(){setLang(b.getAttribute('data-l'))}})(L[j]);
run();
setInterval(function(){var b=document.getElementById('hoy');if(b&&b.getAttribute('data-k')!==ETK()){b.setAttribute('data-k',ETK());if(!activeBtn)run()}},60000);
})();
