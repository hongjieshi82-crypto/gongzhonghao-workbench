// 作者：史鸿洁 · © 2026 史鸿洁 · 采用 CC BY-NC 4.0 许可（署名 · 非商业性使用），详见 LICENSE
/* ==== wx-layouts: 6 visual worlds for WeChat articles (公众号) — v2 ====
 * Pure DOM + inline styles. No classes/ids/CSS variables/position/float in the output.
 * Works inside the workbench (decorateWorkbenchArticle hook) and standalone (render.py).
 * Markdown conventions (all degrade gracefully in the old themes):
 *   first paragraph before the first H2   -> 导语 lede
 *   **文字**                               -> this theme's 重点 style
 *   ==文字==                               -> 荧光笔 highlighter
 *   {{文字}}                               -> 圈注 hand-drawn ellipse (keep it short: 2–8 字)
 *   ++文字++                               -> 波浪线 wavy underline
 *   a paragraph that is entirely **…**     -> 金句放大 standalone key line
 *   > 引用文字 —— 出处                        -> pull quote (cite after ——)
 *   > 【重点】文字  /  > [!重点] 文字          -> callout with label
 *   > 【数据】3周｜说明；4000+｜说明           -> stat cards
 *   ![图注](data:...)                        -> figure + caption
 *   ordered list                             -> numbered points (first sentence emphasised)
 *   last paragraph of the article            -> ending
 */
var WX_SANS='-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
var WX_SERIF='"Songti SC","STSong","Noto Serif CJK SC","Source Han Serif SC","SimSun",serif';
var WX_KAI='"Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC",serif';
var WX_NUM='"Helvetica Neue",Helvetica,Arial,sans-serif';
var WX_MONO='"SF Mono",Menlo,Consolas,"Noto Sans Mono CJK SC",monospace';

function wxHex(h){h=String(h||'').trim();var m=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h);if(!m)return null;var s=m[1];if(s.length===3)s=s.replace(/(.)/g,'$1$1');var n=parseInt(s,16);return [(n>>16)&255,(n>>8)&255,n&255]}
/* mix(a,b,t): t=0 -> a, t=1 -> b */
function wxMix(a,b,t){var x=wxHex(a),y=wxHex(b);if(!x||!y)return a;return '#'+x.map(function(v,i){return Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')}).join('')}

/* Default palette of every theme = the palette of its primary image style, so the six
 * standalone samples already look like the illustrations they belong to. */
var wxLayouts={
 wxMagazine:{name:'动感杂志',hint:'斜体粗标题 · 对话气泡 · 漫画格配图',kicker:'深度观察',palette:{accent:'#2B2A6B',highlight:'#F29A2E',ink:'#2F2E45',muted:'#8B8AA3',line:'#E1E0EF',paper:'#F8F7FD',soft:'#EEEDF8',tint:'#FFE3C2',card:'#FFFFFF'}},
 wxHeadline:{name:'复古报刊',hint:'旧纸底 · 宋体 · 朱砂印章编号 · 着重号',kicker:'深度',palette:{accent:'#B23A2A',highlight:'#B23A2A',ink:'#2A231D',muted:'#7D705F',line:'#D9CBB2',rule:'#2A231D',paper:'#F6EEDD',soft:'#EEE2CB',card:'#FBF6EA'}},
 wxCards:{name:'霓虹卡片',hint:'浅蓝底 · 圆角玩具卡 · 关卡编号',kicker:'个人Agent宇宙',palette:{accent:'#1677D2',highlight:'#F2B705',ink:'#1B2A40',muted:'#6F819A',line:'#D6E6F7',paper:'#EAF3FD',soft:'#E1EEFC',card:'#FFFFFF',glow:'#C6E1FB',pink:'#FF6FA8',mint:'#2EC4A6',chipText:'#1268B8'}},
 wxBigType:{name:'荧光大字',hint:'纯白 · 超大黑字 · 空心巨号 · 荧光绿',kicker:'个人智能体',palette:{accent:'#5E9E00',highlight:'#9BE22A',ink:'#111311',muted:'#8F968C',line:'#E6EAE0',paper:'#FFFFFF',soft:'#F0F8E2'}},
 wxDataReport:{name:'金属报告',hint:'石墨灰底 · 等宽标签 · 进度条编号 · 仪表卡',kicker:'竞品分析',palette:{accent:'#1F2620',highlight:'#8CC21A',highlightText:'#4F7A00',ink:'#30362F',muted:'#7F8A7A',line:'#D6DCD0',paper:'#EFF2EC',soft:'#E4E9DE',card:'#FFFFFF'}},
 wxJournal:{name:'暖色手账',hint:'桃色纸 · 胶带便签 · 楷体批注 · 波浪线',kicker:'手记',palette:{accent:'#E07B4F',highlight:'#FCD9BC',ink:'#4A4038',muted:'#9C8B78',line:'#EADCCB',paper:'#FFF7EE',soft:'#FFF0E2',note:'#FFEFDF',note2:'#DCF1E7',mint:'#6DBE9C',tape:'#F6C6A2',card:'#FFFFFF'}}
};
var wxLayoutOrder=['wxMagazine','wxHeadline','wxCards','wxBigType','wxDataReport','wxJournal'];
/* variants of the two shared layouts (selected through palette.variant) */
var wxLayoutVariants={comic:{layout:'wxCards',name:'波普漫画格',hint:'奶油底 · 粗黑描边 · 硬投影 · 第N格'},pop:{layout:'wxJournal',name:'波普拼贴',hint:'格子纸 · 白边贴纸 · 钴蓝明黄'}};

/* image style (配图风格) -> cover style + layout + palette sampled from its sample images */
var wxImageStyleBindings={
 '动感叙事漫画':{cover:'dynamicNarrative',layout:'wxMagazine',palette:{accent:'#2B2A6B',highlight:'#F29A2E',tint:'#FFE3C2',paper:'#F8F7FD'}},
 '黑金属荧光科技':{cover:'neonMetal',layout:'wxDataReport',palette:{accent:'#1F2620',highlight:'#8CC21A',highlightText:'#4F7A00',paper:'#EFF2EC'}},
 '霓虹科幻卡通':{cover:'neonScifiCartoon',layout:'wxCards',palette:{accent:'#1677D2',highlight:'#F2B705',paper:'#EAF3FD',pink:'#FF6FA8',mint:'#2EC4A6'}},
 '复古波普漫画':{cover:'retroPopComic',layout:'wxCards',palette:{variant:'comic',accent:'#D9412E',highlight:'#F4C21B',ink:'#1B1B1B',muted:'#6D665A',paper:'#FFF3D6',soft:'#FDE6C4',card:'#FFFDF6',line:'#E9D8B8',chipText:'#1B1B1B',sky:'#3BA7E0'}},
 '复古纸艺拼贴':{cover:'vintagePaper',layout:'wxHeadline',palette:{accent:'#B23A2A',ink:'#2A231D',paper:'#F6EEDD'}},
 '暖色手绘信息图':{cover:'warmHanddrawnInfo',layout:'wxJournal',palette:{accent:'#E07B4F',highlight:'#FCD9BC',paper:'#FFF7EE',mint:'#6DBE9C'}},
 '荧光科技人像':{cover:'neonPortrait',layout:'wxBigType',palette:{accent:'#5E9E00',highlight:'#9BE22A',ink:'#111311'}},
 '波普拼贴人像':{cover:'popPortrait',layout:'wxJournal',palette:{variant:'pop',accent:'#2F5BD3',highlight:'#FFE27A',ink:'#222222',muted:'#7C7A70',paper:'#FFFCF4',soft:'#FFF4C9',note:'#FFF2B8',note2:'#E2EAFF',line:'#E4E0CF',mint:'#FF7A9C',tape:'#9DB4F2',card:'#FFFFFF',grid:'#E8ECF8'}}
 ,'自动匹配文章':{cover:'auto',layout:null,palette:null} /* automatic: cover follows, layout stays as is */
};

function wxPalette(config){
 var L=wxLayouts[config.theme];var p={};var k;
 for(k in L.palette)p[k]=L.palette[k];
 if(config.layoutPalette&&config.layoutPaletteFor===config.theme)for(k in config.layoutPalette)p[k]=config.layoutPalette[k];
 if(config.accent&&wxHex(config.accent))p.accent=config.accent;
 return p;
}

/* ---------- markers: ==hl== {{circle}} ++wave++ (text segments only, never inside tags/src) ---------- */
function wxMarkers(html){
 return String(html).split(/(<[^>]+>)/).map(function(seg){
  if(!seg||seg.charAt(0)==='<')return seg;
  return seg.replace(/==([^=\n]{1,120}?)==/g,'<span data-wxm="hl">$1</span>')
   .replace(/\{\{([^{}\n]{1,60}?)\}\}/g,'<span data-wxm="circle">$1</span>')
   .replace(/\+\+([^+\n]{1,120}?)\+\+/g,'<span data-wxm="wave">$1</span>');
 }).join('');
}
/* old themes: turn the markers into plain emphasis so they never show as raw symbols */
function wxStripMarkers(article){
 if(!article||!/==|\{\{|\+\+/.test(article.textContent))return;
 article.innerHTML=wxMarkers(article.innerHTML).replace(/<span data-wxm="(hl|circle|wave)">/g,function(m,k){return k==='hl'?'<span style="background-color:#FFF0A8;padding:0 2px">':k==='circle'?'<span style="border:1.5px solid currentColor;border-radius:50%;padding:0 5px">':'<span style="border-bottom:1px dotted currentColor">'});
}

/* ---------- block extraction from the rendered markdown DOM ---------- */
function wxBlocks(article){
 var blocks=[],seenH2=false,leadDone=false;
 Array.prototype.forEach.call(article.children,function(el){
  var tag=el.tagName;
  if(tag==='H1'){blocks.push({t:'title',html:el.innerHTML,raw:el});return}
  if(tag==='H2'){seenH2=true;var c=el.cloneNode(true);var n=c.querySelector('.heading-number');if(n)n.remove();blocks.push({t:'h2',html:c.innerHTML,full:el.innerHTML});return}
  if(tag==='H3'||tag==='H4'){blocks.push({t:'h3',html:el.innerHTML});return}
  if(tag==='P'){
   var imgs=el.querySelectorAll('img');
   if(imgs.length&&!el.textContent.trim()){Array.prototype.forEach.call(imgs,function(img){var alt=(img.getAttribute('alt')||'').trim();if(/\.(png|jpe?g|webp|gif|heic)$/i.test(alt)||/^(文章配图|image|图片)$/i.test(alt))alt='';blocks.push({t:'figure',src:img.getAttribute('src'),caption:alt})});return}
   if(!el.textContent.trim())return;
   var only=el.children.length===1&&/^(STRONG|B)$/.test(el.children[0].tagName)&&el.children[0].textContent.trim()===el.textContent.trim();
   if(only){blocks.push({t:'key',html:el.children[0].innerHTML});return}
   if(!seenH2&&!leadDone){leadDone=true;blocks.push({t:'lede',html:el.innerHTML});return}
   blocks.push({t:seenH2?'p':'intro',html:el.innerHTML});return}
  if(tag==='BLOCKQUOTE'){
   var html=Array.prototype.map.call(el.querySelectorAll('p'),function(p){return p.innerHTML}).join('<br>')||el.innerHTML;
   var m=/^\s*(?:【([^】]{1,8})】|\[!([^\]]{1,8})\])\s*/.exec(html);
   if(m){var label=m[1]||m[2];var body=html.slice(m[0].length);
    if(/^(数据|数字|关键数字|DATA)$/i.test(label)){
     var items=body.replace(/<br>/g,'；').split(/[；;]/).map(function(s){var kv=s.split(/[｜|]/);return kv.length>1?{value:kv[0].trim(),label:kv.slice(1).join(' ').trim()}:null}).filter(function(x){return x&&x.value});
     if(items.length){blocks.push({t:'stats',items:items});return}}
    blocks.push({t:'callout',label:label,html:body});return}
   var cm=/^([\s\S]*?)\s*(?:——|—|--)\s*([^—<]{1,30})\s*$/.exec(html);
   if(cm&&cm[1].trim())blocks.push({t:'quote',html:cm[1],cite:cm[2].trim()});else blocks.push({t:'quote',html:html});
   return}
  if(tag==='OL'||tag==='UL'){blocks.push({t:tag==='OL'?'ol':'ul',items:Array.prototype.map.call(el.children,function(li){return li.innerHTML})});return}
  if(tag==='TABLE'){
   var head=Array.prototype.map.call(el.querySelectorAll('thead th'),function(x){return x.innerHTML});
   var rows=Array.prototype.map.call(el.querySelectorAll('tbody tr'),function(tr){return Array.prototype.map.call(tr.children,function(td){return td.innerHTML})});
   blocks.push({t:'table',head:head,rows:rows});return}
  if(tag==='HR'){blocks.push({t:'hr'});return}
  blocks.push({t:'raw',el:el});
 });
 for(var i=blocks.length-1;i>=0;i--){if(blocks[i].t==='p'){if(i===blocks.length-1)blocks[i].t='ending';break}if(blocks[i].t!=='raw')break}
 return blocks;
}
/* split "第一句。后文" so a layout can emphasise the first sentence of a point */
function wxFirstSentence(html){var m=/^([^。！？<]{2,60}[。！？])([\s\S]*)$/.exec(html);return m?[m[1],m[2]]:['',html]}
function wxS(o){var out=[];for(var k in o)if(o[k]!==undefined&&o[k]!==null&&o[k]!=='')out.push(k.replace(/[A-Z]/g,function(c){return '-'+c.toLowerCase()})+':'+o[k]);return out.join(';')}
function wxTag(tag,style,inner,attrs){return '<'+tag+(attrs?' '+attrs:'')+' style="'+String(style).replace(/"/g,'&quot;')+'">'+(inner||'')+'</'+tag+'>'}
function wxX(a,b){var o={},k;for(k in a)o[k]=a[k];for(k in (b||{}))o[k]=b[k];return o}
function wxRows(items){var per=items.length===4?2:(items.length<=3?items.length:3);var rows=[];for(var i=0;i<items.length;i+=per)rows.push(items.slice(i,i+per));return rows}
function wxPad(n){return String(n).padStart(2,'0')}
function wxCN(n,upper){var d=upper?'零壹贰叁肆伍陆柒捌玖':'〇一二三四五六七八九',t=upper?'拾':'十';n=Number(n);if(n<10)return d.charAt(n);if(n<20)return t+(n%10?d.charAt(n%10):'');return d.charAt(Math.floor(n/10))+t+(n%10?d.charAt(n%10):'')}
/* 0-height decorative bar that WeChat keeps (has a zero-width char so it is not "empty") */
function wxBar(w,h,c,ex){return wxTag('span',wxS(wxX({display:'inline-block',width:w,height:h,backgroundColor:c,fontSize:'0',lineHeight:'0',overflow:'hidden',verticalAlign:'middle'},ex)),'\u200b')}
/* highlighter stroke: lower part of the line painted */
function wxHL(c,from){from=from===undefined?55:from;return 'linear-gradient(180deg,transparent '+from+'%,'+c+' '+from+'%)'}
function wxImg(src,cap,st){return '<img src="'+src+'" alt="'+String(cap||'').replace(/"/g,'&quot;')+'" style="'+wxS(wxX({display:'block',width:'100%',maxWidth:'100%',height:'auto',margin:'0'},st))+'">'}
function wxCap1(h,st){return String(h).replace(/^([^<\s“"「（(])/,function(c){return wxTag('span',wxS(st),c)})}

/* per-theme inline emphasis: strong (**), hl (==), circle ({{}}), wave (++) */
function wxEm(theme,P){
 var V=P.variant||'';
 if(theme==='wxMagazine')return{
  strong:{color:P.accent,fontWeight:'800',borderBottom:'3px solid '+P.highlight,paddingBottom:'1px'},
  hl:{backgroundImage:wxHL(P.tint,52),padding:'0 1px'},
  circle:{display:'inline-block',lineHeight:'1.45',whiteSpace:'nowrap',textIndent:'0',border:'2px solid '+P.highlight,borderRadius:'50%',padding:'1px 6px',margin:'0 1px'},
  wave:{textDecoration:'underline wavy '+P.highlight,textUnderlineOffset:'4px'}};
 if(theme==='wxHeadline')return{
  strong:{color:P.ink,fontWeight:'900',textEmphasis:'filled dot '+P.accent,WebkitTextEmphasis:'filled dot '+P.accent,textEmphasisPosition:'under right',WebkitTextEmphasisPosition:'under right'},
  hl:{backgroundImage:wxHL(wxMix(P.accent,P.paper,0.8),58),padding:'0 1px'},
  circle:{display:'inline-block',lineHeight:'1.45',whiteSpace:'nowrap',textIndent:'0',border:'1.5px solid '+P.accent,borderRadius:'48% 52% 45% 55% / 58% 45% 55% 42%',padding:'1px 6px',margin:'0 1px'},
  wave:{textDecoration:'underline wavy '+P.accent,textUnderlineOffset:'5px'}};
 if(theme==='wxCards'&&V==='comic')return{
  strong:{color:P.ink,fontWeight:'900',backgroundColor:P.highlight,padding:'0 3px',boxShadow:'2px 2px 0 '+P.ink},
  hl:{backgroundImage:wxHL(wxMix(P.accent,'#ffffff',0.62),50),padding:'0 1px'},
  circle:{display:'inline-block',lineHeight:'1.45',whiteSpace:'nowrap',textIndent:'0',border:'2.5px solid '+P.accent,borderRadius:'50%',padding:'1px 6px',margin:'0 1px'},
  wave:{textDecoration:'underline wavy '+P.accent,textUnderlineOffset:'4px'}};
 if(theme==='wxCards')return{
  strong:{color:P.chipText||P.accent,fontWeight:'800',backgroundColor:P.soft,borderRadius:'6px',padding:'1px 5px'},
  hl:{backgroundImage:wxHL(wxMix(P.highlight,'#ffffff',0.45),52),padding:'0 1px'},
  circle:{display:'inline-block',lineHeight:'1.45',whiteSpace:'nowrap',textIndent:'0',border:'2px dashed '+P.accent,borderRadius:'50%',padding:'1px 7px',margin:'0 1px'},
  wave:{textDecoration:'underline wavy '+(P.pink||P.highlight),textUnderlineOffset:'4px'}};
 if(theme==='wxBigType')return{
  strong:{color:P.ink,fontWeight:'900',backgroundImage:wxHL(P.highlight,62),padding:'0 1px'},
  hl:{backgroundColor:wxMix(P.highlight,'#ffffff',0.5),padding:'1px 3px'},
  circle:{display:'inline-block',lineHeight:'1.45',whiteSpace:'nowrap',textIndent:'0',border:'2px solid '+P.ink,borderRadius:'50%',padding:'1px 7px',margin:'0 1px'},
  wave:{textDecoration:'underline wavy '+P.accent,textUnderlineOffset:'5px'}};
 if(theme==='wxDataReport'){var hl=P.highlightText||P.highlight;return{
  strong:{color:P.accent,fontWeight:'800',borderBottom:'2px solid '+P.highlight},
  hl:{backgroundImage:wxHL(wxMix(P.highlight,'#ffffff',0.6),56),padding:'0 1px'},
  circle:{display:'inline-block',lineHeight:'1.45',whiteSpace:'nowrap',textIndent:'0',border:'1.5px solid '+hl,borderRadius:'50%',padding:'0 6px',margin:'0 1px'},
  wave:{textDecoration:'underline wavy '+hl,textUnderlineOffset:'4px'}}}
 if(theme==='wxJournal'&&V==='pop')return{
  strong:{color:P.accent,fontWeight:'900',backgroundImage:wxHL(P.highlight,50),padding:'0 2px'},
  hl:{backgroundColor:P.highlight,padding:'1px 3px'},
  circle:{display:'inline-block',lineHeight:'1.45',whiteSpace:'nowrap',textIndent:'0',border:'2.5px solid '+P.accent,borderRadius:'50%',padding:'1px 7px',margin:'0 1px'},
  wave:{textDecoration:'underline wavy '+(P.mint||P.accent),textUnderlineOffset:'5px'}};
 return{ /* wxJournal warm */
  strong:{color:P.ink,fontWeight:'800',backgroundImage:wxHL(P.highlight,48),padding:'0 2px'},
  hl:{backgroundImage:wxHL(wxMix(P.mint||P.highlight,'#ffffff',0.55),48),padding:'0 2px'},
  circle:{display:'inline-block',lineHeight:'1.45',whiteSpace:'nowrap',textIndent:'0',border:'2px solid '+P.accent,borderRadius:'52% 48% 55% 45% / 60% 50% 50% 40%',padding:'1px 7px',margin:'0 1px'},
  wave:{textDecoration:'underline wavy '+P.accent,textUnderlineOffset:'5px'}};
}

/* ---------- the six worlds: each maps blocks -> HTML with inline styles ---------- */
function wxBuild(theme,P,cfg,blocks){
 var fs=Number(cfg.font)||15,lh=Number(cfg.line)||1.85,gap=Number(cfg.gap)||22,R=(cfg.radius===undefined?8:Number(cfg.radius));
 var total=blocks.filter(function(b){return b.t==='h2'}).length;var h2i=0,h3i=0,figi=0,out=[];
 var V=P.variant||'';
 var base={margin:'0 0 '+gap+'px',padding:'0',fontSize:fs+'px',lineHeight:lh,color:P.ink,letterSpacing:'0.5px',textAlign:'justify',fontWeight:'400'};
 function para(html,extra){return wxTag('p',wxS(wxX(base,extra)),html)}
 function sec(style,inner){return wxTag('section',style,inner)}
 var h2list=blocks.filter(function(b){return b.t==='h2'}).map(function(b){return b.html});
 var kicker=(cfg.layoutKicker||wxLayouts[theme].kicker||'').trim();
 var tableFollows=!cfg.tableStyle||cfg.tableStyle==='layout';
 var headFollows=!cfg.headingStyle||cfg.headingStyle==='theme';
 var L={};
 var T='data-editor-title="true"';

 /* ===== 1 动感杂志 ← 动感叙事漫画：靛蓝夜空 + 橙色光轨，斜体、速度线、对话气泡、漫画格 ===== */
 if(theme==='wxMagazine'){var IN=P.accent,OR=P.highlight,TI=P.tint;
  var speed=function(w){return wxBar(w||'56px','6px',OR)+wxBar('16px','6px',OR,{marginLeft:'5px'})+wxBar('6px','6px',OR,{marginLeft:'5px'})};
  L={
  root:{padding:'20px 14px 26px',backgroundColor:P.paper},
  masthead:function(){return wxTag('p',wxS({margin:'0 0 16px',fontSize:'12px',lineHeight:1.6,letterSpacing:'2px',fontWeight:'800',fontStyle:'italic',color:IN}),wxTag('span',wxS({color:OR,letterSpacing:'-1px',marginRight:'8px'}),'▶▶▶')+kicker+wxTag('span',wxS({color:P.muted,fontWeight:'500',letterSpacing:'1px',marginLeft:'8px'}),'·　全文 '+total+' 幕'))},
  title:function(h){return wxTag('h1',wxS({margin:'0 0 24px',padding:'0',fontSize:'25px',lineHeight:1.36,fontWeight:'900',fontStyle:'italic',color:IN,letterSpacing:'0.5px',textShadow:'3px 3px 0 '+TI}),h+wxTag('span',wxS({display:'block',margin:'14px 0 0',lineHeight:'0'}),speed('72px')),T)},
  lede:function(h){return sec(wxS({margin:'0 0 30px',padding:'14px 14px 14px 14px',borderLeft:'5px solid '+OR,backgroundColor:TI,backgroundImage:'linear-gradient(100deg,'+TI+' 0%,'+P.paper+' 96%)'}),wxTag('p',wxS({margin:'0 0 6px',fontSize:'12px',fontWeight:'900',fontStyle:'italic',letterSpacing:'2px',color:OR}),'▶ 前情提要')+para(h,{margin:'0',fontWeight:'600',color:IN,textAlign:'left'}))},
  h2:function(h,i){return wxTag('h2',wxS({margin:'54px 0 20px',padding:'0',textAlign:'left',fontWeight:'900',color:IN}),
    wxTag('span',wxS({display:'block',lineHeight:'1',margin:'0 0 8px'}),wxTag('span',wxS({fontFamily:WX_NUM,fontSize:'46px',fontWeight:'900',fontStyle:'italic',color:OR,letterSpacing:'-1px',textShadow:'3px 3px 0 '+wxMix(IN,'#ffffff',0.82)}),wxPad(i))+wxTag('span',wxS({fontSize:'12px',fontWeight:'800',fontStyle:'italic',letterSpacing:'3px',color:IN,marginLeft:'8px'}),'第'+i+'幕 ▶'))+
    wxTag('span',wxS({display:'block',fontSize:'20px',lineHeight:1.45,fontStyle:'italic',letterSpacing:'0.5px'}),h)+wxTag('span',wxS({display:'block',margin:'12px 0 0',lineHeight:'0'}),wxBar('38px','4px',IN)+wxBar('12px','4px',OR,{marginLeft:'4px'})+wxBar('4px','4px',OR,{marginLeft:'4px'})))},
  h3:function(h){return wxTag('h3',wxS({margin:'32px 0 12px',fontSize:'16px',fontWeight:'900',fontStyle:'italic',color:IN,lineHeight:1.6}),wxTag('span',wxS({color:OR,marginRight:'6px'}),'▶')+h)},
  key:function(h){return sec(wxS({margin:'34px 0',padding:'0'}),wxTag('p',wxS({margin:'0 0 10px',lineHeight:'0'}),speed('28px'))+wxTag('p',wxS({margin:'0',fontSize:'21px',lineHeight:1.5,fontWeight:'900',fontStyle:'italic',color:IN,textAlign:'left',letterSpacing:'0.5px',textShadow:'2px 2px 0 '+TI}),h))},
  quote:function(h,c){return sec(wxS({margin:'34px 6px 32px 2px'}),sec(wxS({padding:'16px 18px',backgroundColor:P.card,border:'2px solid '+IN,borderRadius:'22px 22px 22px 3px',boxShadow:'5px 5px 0 '+TI}),wxTag('p',wxS({margin:'0',fontSize:(fs+1.5)+'px',lineHeight:1.7,fontWeight:'800',color:IN,textAlign:'left'}),h))+(c?wxTag('p',wxS({margin:'4px 0 0 2px',fontSize:'13px',lineHeight:1.4,color:IN,fontWeight:'700'}),wxTag('span',wxS({color:IN,fontSize:'18px',marginRight:'6px'}),'◣')+c):''))},
  callout:function(l,h){return sec(wxS({margin:'30px 4px 30px 0',padding:'12px 14px 14px',backgroundColor:'#FFF4E4',border:'2px solid '+IN,boxShadow:'4px 4px 0 '+OR}),wxTag('p',wxS({margin:'0 0 8px'}),wxTag('span',wxS({display:'inline-block',fontSize:'11px',lineHeight:1.6,fontWeight:'900',fontStyle:'italic',letterSpacing:'2px',color:'#ffffff',backgroundColor:IN,padding:'1px 8px'}),'旁白 · '+l))+para(h,{margin:'0',fontSize:(fs-0.5)+'px',color:IN,textAlign:'left'}))},
  stats:function(items){return wxTag('table',wxS({width:'100%',margin:'20px 0 30px',borderCollapse:'separate',borderSpacing:'7px 7px'}),'<tbody>'+wxRows(items).map(function(row){return '<tr>'+row.map(function(it){return wxTag('td',wxS({width:(100/row.length).toFixed(2)+'%',padding:'12px 8px',backgroundColor:P.card,border:'2px solid '+IN,boxShadow:'3px 3px 0 '+OR,verticalAlign:'top',textAlign:'left'}),wxTag('span',wxS({display:'block',fontFamily:WX_NUM,fontSize:'24px',fontWeight:'900',fontStyle:'italic',color:OR,lineHeight:1.15}),it.value)+wxTag('span',wxS({display:'block',marginTop:'4px',fontSize:'11.5px',lineHeight:1.5,color:IN}),it.label))}).join('')+'</tr>'}).join('')+'</tbody>')},
  figure:function(src,cap){return sec(wxS({margin:'34px 8px 34px 0'}),wxImg(src,cap,{border:'2px solid '+IN,boxShadow:'7px 7px 0 '+OR,boxSizing:'border-box'})+(cap?wxTag('p',wxS({margin:'14px 0 0',fontSize:'12px',lineHeight:1.6,color:IN,fontStyle:'italic',fontWeight:'600'}),wxTag('span',wxS({color:OR,marginRight:'6px'}),'▲')+cap):''))},
  ol:function(items){return sec(wxS({margin:'6px 0 '+gap+'px'}),items.map(function(h,i){var f=wxFirstSentence(h);return sec(wxS({margin:'0 0 14px'}),wxTag('p',wxS({margin:'0 0 6px'}),wxTag('span',wxS({display:'inline-block',fontFamily:WX_NUM,fontSize:'12px',lineHeight:1.6,fontWeight:'900',fontStyle:'italic',letterSpacing:'1px',color:'#ffffff',backgroundColor:IN,padding:'0 8px'}),'STEP '+wxPad(i+1))+wxTag('span',wxS({color:OR,fontWeight:'900',marginLeft:'4px',fontSize:'12px'}),'▶▶'))+para((f[0]?wxTag('strong',wxS({color:IN,fontWeight:'900'}),f[0]):'')+f[1],{margin:'0',textAlign:'left'}))}).join(''))},
  table:{wrap:{margin:'24px 0 34px',border:'2px solid '+IN},th:{padding:'9px 6px',backgroundColor:TI,color:IN,fontWeight:'900',fontStyle:'italic',textAlign:'left',borderBottom:'2px solid '+IN},td:{padding:'9px 6px',borderBottom:'1px solid '+P.line,color:P.ink,verticalAlign:'top'},first:{color:IN,fontWeight:'800'}},
  hr:function(){return wxTag('p',wxS({margin:'36px 0',textAlign:'center',color:OR,fontSize:'14px',letterSpacing:'6px',fontWeight:'900'}),'▶▶▶')},
  ending:function(h){return para(h)+wxTag('p',wxS({margin:'44px 0 4px',textAlign:'center',fontSize:'14px',fontWeight:'900',fontStyle:'italic',letterSpacing:'3px',color:IN}),wxTag('span',wxS({color:OR}),'▶▶ ')+'全文完'+wxTag('span',wxS({color:OR}),' ◀◀'))}
 }}

 /* ===== 2 复古报刊 ← 复古纸艺拼贴：旧纸、宋体、朱砂印章、双线刊头、着重号 ===== */
 if(theme==='wxHeadline'){var RED=P.accent,INK=P.rule||P.ink;
  var seal=function(t,size,ex){return wxTag('span',wxS(wxX({display:'inline-block',minWidth:size,height:size,lineHeight:size,textAlign:'center',backgroundColor:RED,color:P.paper,fontFamily:WX_SERIF,fontWeight:'900',borderRadius:'3px',verticalAlign:'middle',boxShadow:'inset 0 0 0 2px '+RED+', inset 0 0 0 3px '+wxMix(RED,P.paper,0.55)},ex)),t)};
  L={
  root:{padding:'22px 16px 26px',backgroundColor:P.paper,fontFamily:WX_SERIF},
  p:{fontFamily:WX_SERIF,color:INK},
  masthead:function(){return sec(wxS({margin:'0 0 22px',padding:'7px 0',borderTop:'3px double '+INK,borderBottom:'3px double '+INK,textAlign:'center'}),wxTag('p',wxS({margin:'0',fontFamily:WX_SERIF,fontSize:'13px',lineHeight:1.6,letterSpacing:'5px',color:INK,fontWeight:'700',textAlign:'center'}),wxTag('span',wxS({color:RED}),'◆ ')+kicker+'　·　共'+wxCN(total)+'章'+wxTag('span',wxS({color:RED}),' ◆')))},
  title:function(h){return wxTag('h1',wxS({margin:'0 0 22px',padding:'0',fontFamily:WX_SERIF,fontSize:'26px',lineHeight:1.42,fontWeight:'900',color:INK,letterSpacing:'1.5px',textAlign:'center'}),h+wxTag('span',wxS({display:'block',margin:'14px 0 0',lineHeight:'1'}),seal('深度','26px',{fontSize:'12px',padding:'0 6px',letterSpacing:'2px'})),T)},
  lede:function(h){return sec(wxS({margin:'0 0 30px',padding:'0 0 20px',borderBottom:'1px solid '+INK}),para(wxTag('span',wxS({display:'inline-block',fontSize:'12px',lineHeight:1.5,color:RED,border:'1px solid '+RED,padding:'0 4px',marginRight:'8px',verticalAlign:'2px',fontWeight:'700',letterSpacing:'1px'}),'导语')+wxCap1(h,{fontSize:'28px',lineHeight:'1',fontWeight:'900',color:RED,marginRight:'2px',verticalAlign:'-3px'}),{margin:'0',fontFamily:WX_SERIF,fontSize:(fs+0.5)+'px',lineHeight:1.95,color:INK,fontWeight:'600'}))},
  h2:function(h,i){return wxTag('h2',wxS({margin:'50px 0 20px',padding:'0 0 12px',borderBottom:'1px solid '+INK,fontFamily:WX_SERIF,fontSize:'20px',lineHeight:1.45,fontWeight:'900',color:INK,textAlign:'left',letterSpacing:'1px'}),
    wxTag('span',wxS({display:'block',margin:'0 0 10px',lineHeight:'1'}),seal(wxCN(i,true),'34px',{fontSize:'18px'})+wxTag('span',wxS({fontFamily:WX_SERIF,fontSize:'12px',letterSpacing:'4px',color:P.muted,marginLeft:'10px',verticalAlign:'middle',fontWeight:'700'}),'第'+wxCN(i)+'章'))+wxTag('span',wxS({display:'block'}),h))},
  h3:function(h){return wxTag('h3',wxS({margin:'30px 0 12px',fontFamily:WX_SERIF,fontSize:'17px',fontWeight:'900',color:INK,lineHeight:1.5}),wxTag('span',wxS({color:RED,marginRight:'6px'}),'◆')+h)},
  key:function(h){return sec(wxS({margin:'32px 0',padding:'14px 6px',borderTop:'1px solid '+P.line,borderBottom:'1px solid '+P.line,textAlign:'center'}),wxTag('p',wxS({margin:'0',fontFamily:WX_SERIF,fontSize:'20px',lineHeight:1.6,fontWeight:'900',color:INK,textAlign:'center',letterSpacing:'1px'}),wxTag('span',wxS({color:RED}),'「')+h+wxTag('span',wxS({color:RED}),'」')))},
  quote:function(h,c){return sec(wxS({margin:'34px 0',padding:'18px 18px 16px',backgroundColor:P.card,border:'1px solid '+P.line,textAlign:'center'}),wxTag('p',wxS({margin:'0',fontFamily:WX_SERIF,fontSize:'18px',lineHeight:1.75,color:INK,fontWeight:'800',textAlign:'center'}),wxTag('span',wxS({color:RED,fontSize:'22px'}),'「')+h+wxTag('span',wxS({color:RED,fontSize:'22px'}),'」'))+(c?wxTag('p',wxS({margin:'12px 0 0',fontFamily:WX_SERIF,fontSize:'12px',color:RED,textAlign:'center',letterSpacing:'2px'}),'—— '+c):''))},
  callout:function(l,h){return sec(wxS({margin:'28px 0',padding:'12px 14px 14px',backgroundColor:P.soft,border:'1px dashed '+wxMix(INK,P.paper,0.45)}),wxTag('p',wxS({margin:'0 0 8px',fontFamily:WX_SERIF,fontSize:'13px',fontWeight:'900',color:RED,letterSpacing:'2px'}),seal('按','22px',{fontSize:'12px',marginRight:'8px'})+'编者按 · '+l)+para(h,{margin:'0',fontFamily:WX_SERIF,fontSize:(fs-0.5)+'px',color:INK}))},
  stats:function(items){return wxTag('table',wxS({width:'100%',margin:'26px 0 32px',borderCollapse:'collapse',borderTop:'3px double '+INK,borderBottom:'1px solid '+INK}),'<tbody>'+wxRows(items).map(function(row,ri){return '<tr>'+row.map(function(it,i){return wxTag('td',wxS({padding:'14px 6px 12px',textAlign:'center',verticalAlign:'top',borderLeft:i?'1px solid '+P.line:'0',borderTop:ri?'1px solid '+P.line:'0',width:(100/row.length).toFixed(2)+'%'}),wxTag('span',wxS({display:'block',fontFamily:WX_SERIF,fontSize:'24px',fontWeight:'900',color:RED,lineHeight:1.15}),it.value)+wxTag('span',wxS({display:'block',marginTop:'6px',fontFamily:WX_SERIF,fontSize:'11.5px',lineHeight:1.5,color:INK}),it.label))}).join('')+'</tr>'}).join('')+'</tbody>')},
  figure:function(src,cap,n){return sec(wxS({margin:'32px 0 34px',padding:'7px 7px 0',backgroundColor:'#FFFDF6',border:'1px solid '+P.line,boxShadow:'0 2px 0 '+P.soft}),wxImg(src,cap,{})+wxTag('p',wxS({margin:'0',padding:'9px 2px 10px',fontFamily:WX_SERIF,fontSize:'12.5px',lineHeight:1.6,color:INK,textAlign:'center',letterSpacing:'1px'}),wxTag('span',wxS({color:RED,fontWeight:'900'}),'图'+wxCN(n)+'　')+(cap||'')))},
  ol:function(items){return sec(wxS({margin:'4px 0 '+gap+'px'}),items.map(function(h,i){var f=wxFirstSentence(h);return para(wxTag('span',wxS({fontFamily:WX_SERIF,fontSize:'18px',fontWeight:'900',color:RED,marginRight:'4px'}),wxCN(i+1)+'、')+(f[0]?wxTag('strong',wxS({color:INK,fontWeight:'900'}),f[0]):'')+f[1],{margin:'0',padding:'12px 0',fontFamily:WX_SERIF,borderBottom:'1px dotted '+wxMix(INK,P.paper,0.5)})}).join(''))},
  table:{wrap:{margin:'26px 0 34px',borderTop:'3px double '+INK,borderBottom:'1px solid '+INK},th:{padding:'9px 5px',borderBottom:'1px solid '+INK,fontFamily:WX_SERIF,color:INK,fontWeight:'900',textAlign:'left'},td:{padding:'10px 5px',borderBottom:'1px solid '+P.line,fontFamily:WX_SERIF,color:INK,verticalAlign:'top'},first:{fontWeight:'900',color:RED}},
  hr:function(){return wxTag('p',wxS({margin:'34px 0',textAlign:'center',color:RED,fontSize:'12px',letterSpacing:'10px'}),'◆◇◆')},
  ending:function(h){return para(h)+wxTag('p',wxS({margin:'40px 0 4px',textAlign:'center',lineHeight:'1'}),seal('完','34px',{fontSize:'17px'}))+wxTag('p',wxS({margin:'8px 0 0',textAlign:'center',fontFamily:WX_SERIF,fontSize:'12px',letterSpacing:'4px',color:P.muted}),'（全文完）')}
 }}

 /* ===== 3 霓虹卡片 ← 霓虹科幻卡通（comic 变体 ← 复古波普漫画） ===== */
 if(theme==='wxCards'){var CM=V==='comic',BL=P.accent,YE=P.highlight,INKc=P.ink;
  var cardSt=CM?{margin:'0 4px 18px 0',padding:'18px 16px 6px',backgroundColor:P.card,border:'2.5px solid '+INKc,borderRadius:'4px',boxShadow:'5px 5px 0 '+INKc}
              :{margin:'0 0 18px',padding:'18px 16px 6px',backgroundColor:P.card,border:'2px solid '+P.line,borderRadius:'18px',boxShadow:'0 5px 0 '+(P.glow||P.line)};
  var pill=function(t,bg,fg,ex){return wxTag('span',wxS(wxX({display:'inline-block',fontSize:'12px',lineHeight:1.6,fontWeight:'900',letterSpacing:'1px',color:fg,backgroundColor:bg,padding:'2px 10px',borderRadius:CM?'3px':'999px',border:CM?'2px solid '+INKc:'0'},ex)),t)};
  var tints=CM?[YE,'#FFFFFF',wxMix(P.accent,'#ffffff',0.78),wxMix(P.sky||BL,'#ffffff',0.7)]:[wxMix(BL,'#ffffff',0.88),wxMix(YE,'#ffffff',0.78),wxMix(P.mint||BL,'#ffffff',0.82),wxMix(P.pink||YE,'#ffffff',0.85)];
  var numC=CM?[INKc,INKc,INKc,INKc]:[BL,'#B98A00',wxMix(P.mint||BL,'#000000',0.25),wxMix(P.pink||YE,'#000000',0.2)];
  L={
  root:{padding:'16px 12px 8px',backgroundColor:P.paper},p:{textAlign:'left'},
  wrap:true,card:wxS(cardSt),
  masthead:function(){return CM?wxTag('p',wxS({margin:'0 0 14px',fontSize:'12px',lineHeight:1.6,fontWeight:'900',letterSpacing:'2px',color:INKc}),pill('POW!',YE,INKc,{fontStyle:'italic',boxShadow:'2px 2px 0 '+INKc,marginRight:'8px'})+kicker+wxTag('span',wxS({color:P.accent,marginLeft:'6px'}),'★ 共'+total+'格'))
     :wxTag('p',wxS({margin:'0 0 14px',fontSize:'12px',lineHeight:1.6,fontWeight:'800',letterSpacing:'2px',color:P.chipText||BL}),wxBar('9px','9px',BL,{borderRadius:'50%',marginRight:'5px'})+wxBar('9px','9px',YE,{borderRadius:'50%',marginRight:'5px'})+wxBar('9px','9px',P.pink||BL,{borderRadius:'50%',marginRight:'10px'})+kicker+wxTag('span',wxS({color:YE,marginLeft:'6px'}),'✦'))},
  title:function(h){return CM?wxTag('h1',wxS({margin:'0 4px 20px 0',padding:'0',fontSize:'25px',lineHeight:1.4,fontWeight:'900',color:INKc,letterSpacing:'0.5px',textShadow:'3px 3px 0 '+YE}),h,T)
     :wxTag('h1',wxS({margin:'0 2px 18px',padding:'0',fontSize:'23px',lineHeight:1.45,fontWeight:'900',color:INKc,textShadow:'0 0 16px '+(P.glow||P.line)}),h,T)},
  lede:function(h){return {open:wxTag('p',wxS({margin:'0 0 10px'}),CM?pill('开场白',P.accent,'#ffffff'):pill('✦ 导读',YE,INKc))+para(h,{fontSize:(fs+0.5)+'px',fontWeight:'600',color:INKc})}},
  h2:function(h,i){var head;
    if(CM)head=wxTag('p',wxS({margin:'0 0 10px'}),pill('第 '+i+' 格',YE,INKc,{fontStyle:'italic',fontSize:'13px',boxShadow:'2px 2px 0 '+INKc}));
    else{var st='';for(var s=1;s<=total;s++)st+=s<=i?'★':'☆';head=wxTag('p',wxS({margin:'0 0 10px'}),pill('LV.'+i,BL,'#ffffff',{fontFamily:WX_NUM})+wxTag('span',wxS({fontSize:'13px',letterSpacing:'2px',color:YE,marginLeft:'8px',verticalAlign:'-1px'}),st))}
    return head+wxTag('h2',wxS({margin:'0 0 14px',padding:'0',fontSize:'19px',lineHeight:1.45,fontWeight:'900',color:INKc,textAlign:'left'}),h+wxTag('span',wxS({display:'block',margin:'10px 0 0',lineHeight:'0'}),CM?wxBar('44px','4px',INKc)+wxBar('14px','4px',P.accent,{marginLeft:'4px'}):wxBar('28px','5px',BL,{borderRadius:'3px'})+wxBar('10px','5px',YE,{borderRadius:'3px',marginLeft:'4px'})+wxBar('5px','5px',P.pink||YE,{borderRadius:'3px',marginLeft:'4px'})))},
  h3:function(h){return wxTag('h3',wxS({margin:'22px 0 10px',fontSize:'16px',fontWeight:'900',color:INKc,lineHeight:1.5}),wxBar('8px','8px',CM?P.accent:BL,{borderRadius:CM?'0':'50%',marginRight:'8px'})+h)},
  key:function(h){return CM?sec(wxS({margin:'22px 4px '+gap+'px 0',padding:'12px 14px',backgroundColor:YE,border:'2.5px solid '+INKc,boxShadow:'4px 4px 0 '+P.accent,textAlign:'center'}),wxTag('p',wxS({margin:'0',fontSize:'19px',lineHeight:1.5,fontWeight:'900',fontStyle:'italic',color:INKc,textAlign:'center'}),h))
     :sec(wxS({margin:'20px 0 '+gap+'px',padding:'14px 12px',backgroundColor:P.soft,borderRadius:'16px',textAlign:'center'}),wxTag('p',wxS({margin:'0',fontSize:'18px',lineHeight:1.55,fontWeight:'900',color:P.chipText||BL,textAlign:'center'}),wxTag('span',wxS({color:YE,marginRight:'6px'}),'✦')+h+wxTag('span',wxS({color:YE,marginLeft:'6px'}),'✦')))},
  quote:function(h,c){return CM?sec(wxS({margin:'20px 4px '+gap+'px 0',padding:'14px 16px',backgroundColor:'#FFFFFF',border:'2.5px solid '+INKc,borderRadius:'24px 24px 24px 3px'}),wxTag('p',wxS({margin:'0',fontSize:(fs+1)+'px',lineHeight:1.7,color:INKc,fontWeight:'800',textAlign:'left'}),h)+(c?wxTag('p',wxS({margin:'8px 0 0',fontSize:'12px',fontWeight:'900',color:P.accent,textAlign:'right'}),'—— '+c):''))
     :sec(wxS({margin:'18px 0 '+gap+'px',padding:'14px 14px 12px',backgroundColor:P.soft,borderRadius:'16px'}),wxTag('p',wxS({margin:'0',fontFamily:WX_NUM,fontSize:'30px',lineHeight:0.9,height:'20px',color:YE,fontWeight:'900'}),'“')+wxTag('p',wxS({margin:'0',fontSize:(fs+0.5)+'px',lineHeight:1.75,color:INKc,fontWeight:'700',textAlign:'left'}),h)+(c?wxTag('p',wxS({margin:'8px 0 0',fontSize:'12px',color:P.muted,textAlign:'right'}),'—— '+c):''))},
  callout:function(l,h){return CM?sec(wxS({margin:'18px 4px '+gap+'px 0',padding:'12px 14px',border:'2px solid '+INKc,backgroundColor:wxMix(P.accent,'#ffffff',0.88)}),wxTag('p',wxS({margin:'0 0 8px'}),pill('!! '+l,P.accent,'#ffffff'))+para(h,{margin:'0',fontSize:(fs-0.5)+'px',color:INKc}))
     :sec(wxS({margin:'18px 0 '+gap+'px',padding:'12px 14px',border:'2px dashed '+wxMix(BL,'#ffffff',0.45),borderRadius:'16px',backgroundColor:P.card}),wxTag('p',wxS({margin:'0 0 8px'}),pill('TIP · '+l,YE,INKc))+para(h,{margin:'0',fontSize:(fs-0.5)+'px'}))},
  stats:function(items){var rows=[];for(var i=0;i<items.length;i+=2)rows.push(items.slice(i,i+2));var n=0;return wxTag('table',wxS({width:'100%',margin:'4px 0 '+gap+'px',borderCollapse:'separate',borderSpacing:'6px 6px'}),'<tbody>'+rows.map(function(r){return '<tr>'+r.map(function(it){var k=n++%4;return wxTag('td',wxS({width:'50%',padding:'12px 10px',backgroundColor:tints[k],borderRadius:CM?'3px':'14px',border:CM?'2px solid '+INKc:'0',verticalAlign:'top'}),wxTag('span',wxS({display:'block',fontFamily:WX_NUM,fontSize:'23px',fontWeight:'900',fontStyle:CM?'italic':'normal',color:numC[k],lineHeight:1.2}),it.value)+wxTag('span',wxS({display:'block',marginTop:'4px',fontSize:'12px',lineHeight:1.5,color:CM?INKc:P.muted}),it.label))}).join('')+(r.length<2?'<td style="width:50%"></td>':'')+'</tr>'}).join('')+'</tbody>')},
  figure:function(src,cap){return sec(wxS({margin:'18px 0 '+gap+'px'}),wxImg(src,cap,CM?{border:'2.5px solid '+INKc,boxSizing:'border-box'}:{borderRadius:'16px',border:'3px solid #ffffff',boxShadow:'0 0 0 2px '+(P.glow||P.line),boxSizing:'border-box'})+(cap?wxTag('p',wxS({margin:'10px 0 0',fontSize:'12px',lineHeight:1.6,color:CM?INKc:P.muted,textAlign:'center',fontWeight:CM?'700':'400'}),(CM?'▲ ':'✦ ')+cap):''))},
  ol:function(items){return sec(wxS({margin:'4px 0 '+gap+'px'}),items.map(function(h,i){var f=wxFirstSentence(h);return sec(wxS({margin:'0 0 8px',padding:'12px 12px',backgroundColor:CM?'#FFFFFF':P.soft,borderRadius:CM?'3px':'14px',border:CM?'2px solid '+INKc:'0'}),para(wxTag('span',wxS({display:'inline-block',minWidth:'22px',height:'22px',lineHeight:'22px',textAlign:'center',borderRadius:CM?'0':'50%',backgroundColor:CM?INKc:YE,color:CM?YE:INKc,fontFamily:WX_NUM,fontSize:'12px',fontWeight:'900',marginRight:'8px',verticalAlign:'1px'}),String(i+1))+(f[0]?wxTag('strong',wxS({color:INKc,fontWeight:'900'}),f[0]):'')+f[1],{margin:'0',fontSize:(fs-0.5)+'px'}))}).join(''))},
  table:{wrap:{margin:'8px 0 '+gap+'px',border:CM?'2px solid '+INKc:'1px solid '+P.line},th:{padding:'9px 6px',backgroundColor:CM?YE:P.soft,color:CM?INKc:(P.chipText||BL),fontWeight:'900',textAlign:'left',borderBottom:CM?'2px solid '+INKc:'1px solid '+P.line},td:{padding:'9px 6px',borderBottom:'1px solid '+P.line,color:INKc,verticalAlign:'top'},first:{fontWeight:'800'}},
  hr:function(){return wxTag('p',wxS({margin:'18px 0',textAlign:'center',color:CM?P.accent:YE,letterSpacing:'8px'}),CM?'★★★':'✦✦✦')},
  ending:function(h){return {own:true,html:wxTag('p',wxS({margin:'0 0 10px'}),CM?pill('THE END!',YE,INKc,{fontStyle:'italic',boxShadow:'2px 2px 0 '+INKc}):pill('✦ 本关完成 ✦',BL,'#ffffff'))+para(h)}}
 }}

 /* ===== 4 荧光大字 ← 荧光科技人像：纯白、超大黑字、空心巨号、荧光绿 ===== */
 if(theme==='wxBigType'){var bfs=fs+1,LM=P.highlight,K=P.ink;L={
  root:{padding:'6px 8px 22px',backgroundColor:P.paper},
  masthead:function(){return wxTag('p',wxS({margin:'0 0 22px',padding:'0 0 10px',borderBottom:'2px solid '+K,fontSize:'12px',lineHeight:1.6,fontWeight:'900',letterSpacing:'3px',color:K}),wxBar('10px','10px',LM,{marginRight:'8px',verticalAlign:'0'})+kicker+wxTag('span',wxS({fontFamily:WX_NUM,color:P.muted,fontWeight:'700',letterSpacing:'2px',marginLeft:'8px'}),'/ '+wxPad(total)+' PARTS'))},
  title:function(h){return wxTag('h1',wxS({margin:'0 0 26px',padding:'0',fontSize:'32px',lineHeight:1.24,fontWeight:'900',color:K,letterSpacing:'-0.5px'}),wxTag('span',wxS({backgroundImage:wxHL(LM,64),padding:'0 2px'}),h),T)},
  lede:function(h){return para(h,{fontSize:'18px',lineHeight:1.72,fontWeight:'700',color:K,margin:'0 0 40px',textAlign:'left',letterSpacing:'0'})},
  h2:function(h,i){return wxTag('h2',wxS({margin:'70px 0 24px',padding:'0',textAlign:'left',color:K,fontWeight:'900'}),wxTag('span',wxS({display:'block',fontFamily:WX_NUM,fontSize:'76px',lineHeight:'0.92',fontWeight:'900',letterSpacing:'-2px',color:P.soft,WebkitTextStroke:'1.2px '+K}),wxPad(i))+wxTag('span',wxS({display:'block',margin:'6px 0 0',fontSize:'25px',lineHeight:1.3,fontWeight:'900',letterSpacing:'0'}),h))},
  h3:function(h){return wxTag('h3',wxS({margin:'40px 0 14px',fontSize:'20px',fontWeight:'900',color:K,lineHeight:1.45}),h)},
  p:{fontSize:bfs+'px',lineHeight:Math.max(lh,1.9),color:'#222222',textAlign:'left',margin:'0 0 '+(gap+6)+'px'},
  key:function(h){return wxTag('p',wxS({margin:'40px 0',padding:'2px 0 2px 14px',borderLeft:'6px solid '+LM,fontSize:'23px',lineHeight:1.45,fontWeight:'900',color:K,textAlign:'left',letterSpacing:'0'}),h)},
  quote:function(h,c){return sec(wxS({margin:'56px 0'}),wxTag('p',wxS({margin:'0',fontFamily:WX_NUM,fontSize:'88px',lineHeight:'0.8',height:'44px',fontWeight:'900',color:LM}),'“')+wxTag('p',wxS({margin:'0',fontSize:'22px',lineHeight:1.5,fontWeight:'900',color:K,textAlign:'left',letterSpacing:'0'}),h)+(c?wxTag('p',wxS({margin:'14px 0 0',fontSize:'12px',fontWeight:'700',letterSpacing:'2px',color:P.muted}),'— '+c):''))},
  callout:function(l,h){return sec(wxS({margin:'40px 0',padding:'14px 0 0',borderTop:'2px solid '+K}),wxTag('p',wxS({margin:'0 0 10px'}),wxTag('span',wxS({display:'inline-block',fontSize:'12px',lineHeight:1.6,fontWeight:'900',letterSpacing:'3px',color:K,backgroundColor:LM,padding:'1px 8px'}),l))+para(h,{margin:'0',fontSize:'18px',lineHeight:1.7,fontWeight:'800',color:K,textAlign:'left'}))},
  stats:function(items){return sec(wxS({margin:'44px 0'}),items.map(function(it){return sec(wxS({margin:'0 0 22px'}),wxTag('p',wxS({margin:'0',fontFamily:WX_NUM,fontSize:'50px',lineHeight:1.05,fontWeight:'900',color:K,letterSpacing:'-1.5px'}),wxTag('span',wxS({backgroundImage:wxHL(LM,66),padding:'0 2px'}),it.value))+wxTag('p',wxS({margin:'6px 0 0',fontSize:'13px',color:P.muted,lineHeight:1.5,fontWeight:'600'}),it.label))}).join(''))},
  figure:function(src,cap){return sec(wxS({margin:'44px 0'}),wxImg(src,cap,{})+(cap?wxTag('p',wxS({margin:'10px 0 0',fontSize:'12px',lineHeight:1.6,color:K,textAlign:'right',fontWeight:'700'}),cap+wxBar('18px','4px',LM,{marginLeft:'8px'})):''))},
  ol:function(items){return sec(wxS({margin:'8px 0 '+gap+'px'}),items.map(function(h,i){var f=wxFirstSentence(h);return sec(wxS({margin:'0 0 28px'}),wxTag('p',wxS({margin:'0 0 6px',fontFamily:WX_NUM,fontSize:'44px',lineHeight:1,fontWeight:'900',color:P.soft,WebkitTextStroke:'1.2px '+K,letterSpacing:'-2px'}),wxPad(i+1))+para((f[0]?wxTag('strong',wxS({color:K,fontWeight:'900'}),f[0]):'')+f[1],{margin:'0',fontSize:bfs+'px',textAlign:'left'}))}).join(''))},
  table:{wrap:{margin:'36px 0 44px',borderTop:'2px solid '+K},th:{padding:'10px 6px',borderBottom:'1px solid '+K,color:K,fontWeight:'900',fontSize:'11px',letterSpacing:'1px',textAlign:'left'},td:{padding:'12px 6px',borderBottom:'1px solid '+P.line,color:'#222222',verticalAlign:'top'},first:{fontWeight:'900',color:K}},
  hr:function(){return sec(wxS({margin:'56px 0',height:'0',borderTop:'0'}),'')},
  ending:function(h){return para(h,{fontSize:bfs+'px',textAlign:'left'})+wxTag('p',wxS({margin:'60px 0 8px',textAlign:'center',fontFamily:WX_NUM,fontSize:'12px',fontWeight:'900',letterSpacing:'6px',color:K}),wxBar('12px','12px',LM,{marginRight:'10px',verticalAlign:'-1px'})+'END')}
 }}

 /* ===== 5 金属报告 ← 黑金属荧光科技：石墨灰底、等宽标签、进度条编号、仪表卡 ===== */
 if(theme==='wxDataReport'){var hl=P.highlightText||P.highlight,G=P.accent,LMg=P.highlight;
  var mono=function(t,ex){return wxTag('span',wxS(wxX({fontFamily:WX_MONO,fontSize:'11px',fontWeight:'700',letterSpacing:'1px'},ex)),t)};
  var chip=function(t){return wxTag('span',wxS({display:'inline-block',fontFamily:WX_MONO,fontSize:'11px',lineHeight:1.6,fontWeight:'700',letterSpacing:'1px',color:LMg,backgroundColor:G,padding:'1px 7px',borderRadius:'2px'}),t)};
  var segs=function(i,n){var s='';for(var k=1;k<=n;k++)s+=wxBar('16px','4px',k<=i?LMg:P.line,{marginRight:'3px',borderRadius:'1px'});return s};
  L={
  root:{padding:'16px 12px 22px',backgroundColor:P.paper},
  masthead:function(){return sec(wxS({margin:'0 0 18px'}),wxTag('p',wxS({margin:'0 0 8px',lineHeight:1.6}),chip('● RESEARCH NOTE')+mono('　// '+kicker+' · '+wxPad(total)+' SECTIONS',{color:P.muted}))+wxTag('p',wxS({margin:'0',lineHeight:'0'}),wxBar('100%','2px',G,{display:'block'})))},
  title:function(h){return wxTag('h1',wxS({margin:'0 0 18px',padding:'0 0 0 12px',borderLeft:'4px solid '+LMg,fontSize:'21px',lineHeight:1.45,fontWeight:'800',color:G}),h,T)},
  lede:function(h){return sec(wxS({margin:'0 0 22px',backgroundColor:P.card,border:'1px solid '+P.line,borderTop:'3px solid '+LMg,borderRadius:'3px'}),wxTag('p',wxS({margin:'0',padding:'8px 12px',borderBottom:'1px dashed '+P.line,lineHeight:1.6}),mono('SUMMARY ▸ 摘要',{color:hl}))+para(h,{margin:'0',padding:'12px 14px 14px',color:P.ink}))},
  toc:function(){return sec(wxS({margin:'0 0 32px',padding:'10px 12px 4px',backgroundColor:P.card,border:'1px solid '+P.line,borderRadius:'3px'}),wxTag('p',wxS({margin:'0 0 4px',lineHeight:1.6}),mono('INDEX ▸ 目录',{color:P.muted}))+h2list.map(function(h,i){return wxTag('p',wxS({margin:'0',padding:'7px 0',borderTop:i?'1px dashed '+P.line:'0',fontSize:'14px',lineHeight:1.6,color:P.ink}),mono(wxPad(i+1),{color:hl,marginRight:'10px',fontSize:'12px'})+h.replace(/<[^>]+>/g,''))}).join(''))},
  h2:function(h,i){return wxTag('h2',wxS({margin:'46px 0 16px',padding:'0',fontSize:'18px',lineHeight:1.5,fontWeight:'800',color:G,textAlign:'left'}),wxTag('span',wxS({display:'block',margin:'0 0 8px',lineHeight:'1.6'}),chip('SEC.'+wxPad(i))+mono('　'+wxPad(i)+'/'+wxPad(total)+'　',{color:P.muted})+segs(i,total))+wxTag('span',wxS({display:'block',padding:'0 0 10px',borderBottom:'1px solid '+P.line}),h))},
  h3:function(h,i,j){return wxTag('h3',wxS({margin:'26px 0 10px',fontSize:'16px',fontWeight:'800',color:G,lineHeight:1.5}),mono(i+'.'+j,{color:hl,marginRight:'8px',fontSize:'13px'})+h)},
  key:function(h){return sec(wxS({margin:'26px 0',padding:'12px 14px',backgroundColor:P.card,border:'1px solid '+P.line,borderLeft:'3px solid '+LMg}),wxTag('p',wxS({margin:'0',fontSize:'17px',lineHeight:1.6,fontWeight:'800',color:G,textAlign:'left'}),mono('&gt;_ ',{color:hl,fontSize:'14px'})+h+wxTag('span',wxS({color:LMg,marginLeft:'2px'}),'▌')))},
  quote:function(h,c){return sec(wxS({margin:'24px 0',padding:'12px 14px',backgroundColor:P.card,border:'1px solid '+P.line,borderLeft:'3px solid '+G}),wxTag('p',wxS({margin:'0 0 6px',lineHeight:1.6}),mono('QUOTE //',{color:P.muted}))+wxTag('p',wxS({margin:'0',fontSize:fs+'px',lineHeight:1.75,color:G,fontWeight:'600',textAlign:'left'}),h)+(c?wxTag('p',wxS({margin:'8px 0 0',lineHeight:1.6}),mono('SRC: '+c,{color:hl,fontWeight:'400'})):''))},
  callout:function(l,h){return sec(wxS({margin:'24px 0',padding:'12px 14px',backgroundColor:P.card,border:'1px solid '+P.line,borderTop:'2px solid '+LMg}),wxTag('p',wxS({margin:'0 0 8px'}),wxTag('span',wxS({display:'inline-block',fontFamily:WX_MONO,fontSize:'11px',lineHeight:1.6,fontWeight:'700',letterSpacing:'1px',color:G,backgroundColor:LMg,padding:'1px 7px',borderRadius:'2px'}),'▲ INSIGHT · '+l))+para(h,{margin:'0',fontWeight:'600',color:G}))},
  stats:function(items){var rows=wxRows(items);return wxTag('table',wxS({width:'100%',margin:'18px 0 28px',borderCollapse:'separate',borderSpacing:'5px 5px'}),'<tbody>'+rows.map(function(r){return '<tr>'+r.map(function(it){return wxTag('td',wxS({width:(100/r.length).toFixed(2)+'%',padding:'10px 10px 10px',backgroundColor:P.card,border:'1px solid '+P.line,borderRadius:'3px',verticalAlign:'top',textAlign:'left'}),wxTag('span',wxS({display:'block',fontFamily:WX_NUM,fontSize:'22px',fontWeight:'800',color:G,lineHeight:1.2}),it.value)+wxTag('span',wxS({display:'block',margin:'6px 0 6px',lineHeight:'0'}),wxBar('22px','3px',LMg)+wxBar('10px','3px',P.line,{marginLeft:'2px'}))+wxTag('span',wxS({display:'block',fontSize:'11.5px',lineHeight:1.5,color:P.muted}),it.label))}).join('')+'</tr>'}).join('')+'</tbody>')},
  figure:function(src,cap,n){return sec(wxS({margin:'28px 0 30px',padding:'6px',backgroundColor:P.card,border:'1px solid '+P.line,borderRadius:'3px'}),wxTag('p',wxS({margin:'0 0 6px',padding:'0 2px',fontSize:'12px',lineHeight:1.6,fontWeight:'700',color:G}),mono('FIG.'+wxPad(n)+' ─ ',{color:hl})+(cap||''))+wxImg(src,cap,{borderRadius:'2px'}))},
  ol:function(items){return sec(wxS({margin:'4px 0 '+gap+'px',borderTop:'1px solid '+G}),items.map(function(h,i){var f=wxFirstSentence(h);return para(wxTag('span',wxS({display:'block',margin:'0 0 4px'}),chip('R'+wxPad(i+1)))+(f[0]?wxTag('strong',wxS({color:G,fontWeight:'800'}),f[0]):'')+f[1],{margin:'0',padding:'12px 0',borderBottom:'1px solid '+P.line})}).join(''))},
  table:{wrap:{margin:'20px 0 30px',border:'1px solid '+P.line,backgroundColor:P.card},th:{padding:'8px 6px',backgroundColor:P.soft,color:G,fontWeight:'800',textAlign:'left',border:'1px solid '+P.line},td:{padding:'8px 6px',border:'1px solid '+P.line,color:P.ink,verticalAlign:'top'},first:{fontWeight:'800',color:G}},
  hr:function(){return wxTag('p',wxS({margin:'30px 0',lineHeight:'0',textAlign:'center'}),segs(0,8))},
  ending:function(h){return sec(wxS({margin:'40px 0 8px',padding:'14px 0 0',borderTop:'2px solid '+G}),wxTag('p',wxS({margin:'0 0 8px',lineHeight:1.6}),mono('// CONCLUSION 结语',{color:hl}))+para(h)+wxTag('p',wxS({margin:'26px 0 0',textAlign:'center',lineHeight:1.6}),mono('— END OF REPORT —',{color:P.muted,letterSpacing:'3px'})))}
 }}

 /* ===== 6 暖色手账 ← 暖色手绘信息图（pop 变体 ← 波普拼贴人像） ===== */
 if(theme==='wxJournal'){var PO=V==='pop',AC=P.accent,INKj=P.ink;
  var tape=function(c,w,rot){return wxTag('p',wxS({margin:'0 0 -9px',textAlign:'center',lineHeight:'0'}),wxBar(w||'72px','16px',c||P.tape,{opacity:'0.85',transform:'rotate('+(rot||-2)+'deg)'}))};
  var sticker=PO?{boxShadow:'0 0 0 4px #ffffff, 0 4px 12px rgba(30,40,90,0.16)'}:{};
  L={
  root:PO?{padding:'20px 16px 24px',backgroundColor:P.paper,backgroundImage:'linear-gradient('+P.grid+' 1px, transparent 1px), linear-gradient(90deg, '+P.grid+' 1px, transparent 1px)',backgroundSize:'22px 22px'}:{padding:'20px 16px 24px',backgroundColor:P.paper},
  p:{lineHeight:Math.max(lh,1.9),textAlign:'left'},
  masthead:function(){return PO?wxTag('p',wxS({margin:'0 0 18px',fontSize:'13px',lineHeight:1.6,fontWeight:'900',letterSpacing:'2px',color:INKj}),wxTag('span',wxS({display:'inline-block',backgroundColor:AC,color:'#ffffff',padding:'2px 10px',marginRight:'10px',transform:'rotate(-4deg)',fontStyle:'italic',boxShadow:'0 0 0 3px #ffffff'}),'POP!')+kicker+wxTag('span',wxS({color:'#F2B400',fontSize:'18px',marginLeft:'8px',verticalAlign:'-2px'}),'✸'))
     :wxTag('p',wxS({margin:'0 0 18px',padding:'0 0 10px',borderBottom:'1.5px dashed '+wxMix(P.line,INKj,0.2),fontFamily:WX_KAI,fontSize:'15px',lineHeight:1.6,letterSpacing:'2px',color:AC,fontWeight:'700'}),'✎ '+kicker+wxTag('span',wxS({color:P.mint,marginLeft:'10px',letterSpacing:'0'}),'～ ✿ ～'))},
  title:function(h){return PO?wxTag('h1',wxS({margin:'0 0 24px',padding:'0',fontSize:'24px',lineHeight:1.5,fontWeight:'900',color:INKj}),wxTag('span',wxS({backgroundImage:wxHL(P.highlight,48),padding:'0 3px'}),h),T)
     :wxTag('h1',wxS({margin:'0 0 24px',padding:'0',fontSize:'22px',lineHeight:1.6,fontWeight:'800',color:INKj}),wxTag('span',wxS({backgroundImage:wxHL(P.highlight,52),padding:'0 3px'}),h),T)},
  lede:function(h){return PO?sec(wxS({margin:'0 0 32px'}),tape(P.tape,'84px',3)+sec(wxS(wxX({padding:'16px 16px 6px',backgroundColor:P.note,borderRadius:'2px'},sticker)),wxTag('p',wxS({margin:'0 0 6px',fontSize:'13px',fontWeight:'900',color:AC,letterSpacing:'2px'}),'★ 先读这段')+para(h,{margin:'0 0 10px',fontWeight:'600'})))
     :sec(wxS({margin:'0 0 32px'}),tape(P.tape,'76px',-2)+sec(wxS({padding:'16px 16px 6px',backgroundColor:P.note,border:'1px dashed '+wxMix(P.line,INKj,0.25),borderRadius:'3px 3px 18px 3px',boxShadow:'0 3px 8px rgba(140,90,40,0.10)'}),wxTag('p',wxS({margin:'0 0 6px',fontFamily:WX_KAI,fontSize:'15px',fontWeight:'700',color:AC,letterSpacing:'1px'}),'✎ 先读这段')+para(h,{margin:'0 0 10px'})))},
  h2:function(h,i){var num=PO?wxTag('span',wxS(wxX({display:'inline-block',width:'34px',height:'34px',lineHeight:'34px',textAlign:'center',borderRadius:'50%',backgroundColor:P.highlight,color:INKj,fontFamily:WX_NUM,fontSize:'16px',fontWeight:'900',verticalAlign:'middle',transform:'rotate(-8deg)'},sticker)),String(i))
      :wxTag('span',wxS({display:'inline-block',width:'32px',height:'32px',lineHeight:'29px',textAlign:'center',borderRadius:'50%',backgroundColor:P.note2,border:'1.5px dashed '+P.mint,color:INKj,fontFamily:WX_KAI,fontSize:'17px',fontWeight:'700',verticalAlign:'middle',boxSizing:'border-box'}),String(i));
    return wxTag('h2',wxS({margin:'48px 0 18px',padding:'0',fontSize:PO?'20px':'19px',lineHeight:1.6,fontWeight:PO?'900':'800',color:INKj,textAlign:'left'}),wxTag('span',wxS({display:'block',margin:'0 0 8px',lineHeight:'1'}),num+wxTag('span',wxS({fontFamily:PO?WX_SANS:WX_KAI,fontSize:'13px',fontWeight:PO?'900':'700',letterSpacing:'2px',color:AC,marginLeft:'10px',verticalAlign:'middle'}),PO?'STICKER '+wxPad(i):'第 '+i+' 页'))+wxTag('span',wxS(PO?{borderBottom:'4px solid '+AC,paddingBottom:'2px'}:{textDecoration:'underline wavy '+AC,textUnderlineOffset:'7px'}),h))},
  h3:function(h){return wxTag('h3',wxS({margin:'28px 0 12px',fontSize:'16px',fontWeight:'800',color:INKj,lineHeight:1.6}),wxTag('span',wxS({color:PO?AC:P.mint,marginRight:'6px'}),PO?'✸':'✿')+h)},
  key:function(h){return PO?sec(wxS({margin:'30px 8px'}),sec(wxS(wxX({padding:'12px 14px',backgroundColor:P.highlight,transform:'rotate(-1deg)',textAlign:'center'},sticker)),wxTag('p',wxS({margin:'0',fontSize:'19px',lineHeight:1.5,fontWeight:'900',color:AC,textAlign:'center'}),h)))
     :sec(wxS({margin:'30px 4px',padding:'12px 16px',border:'1.5px dashed '+AC,borderRadius:'999px',textAlign:'center',backgroundColor:P.card}),wxTag('p',wxS({margin:'0',fontFamily:WX_KAI,fontSize:'19px',lineHeight:1.55,fontWeight:'700',color:INKj,textAlign:'center'}),wxTag('span',wxS({color:AC}),'～ ')+h+wxTag('span',wxS({color:AC}),' ～')))},
  quote:function(h,c){return PO?sec(wxS(wxX({margin:'30px 6px',padding:'14px 16px',backgroundColor:P.card},sticker)),wxTag('p',wxS({margin:'0',fontFamily:WX_NUM,fontSize:'40px',lineHeight:'0.9',height:'24px',color:AC,fontWeight:'900'}),'❝')+wxTag('p',wxS({margin:'0',fontSize:(fs+1.5)+'px',lineHeight:1.7,color:INKj,fontWeight:'800',textAlign:'left'}),h)+(c?wxTag('p',wxS({margin:'8px 0 0',fontSize:'12px',fontWeight:'900',color:AC,textAlign:'right'}),'—— '+c):''))
     :sec(wxS({margin:'28px 4px',padding:'14px 16px 14px 18px',backgroundColor:P.card,borderLeft:'3px double '+wxMix(AC,'#ffffff',0.35),borderRadius:'0 10px 10px 0'}),wxTag('p',wxS({margin:'0',fontFamily:WX_KAI,fontSize:(fs+2.5)+'px',lineHeight:1.75,color:INKj,textAlign:'left'}),h)+(c?wxTag('p',wxS({margin:'8px 0 0',fontFamily:WX_KAI,fontSize:'13px',color:AC,textAlign:'right'}),'✎ '+c):''))},
  callout:function(l,h){return sec(wxS({margin:'30px 2px 28px'}),tape(PO?P.highlight:P.mint,'60px',2)+sec(wxS(wxX({padding:'14px 14px 4px',backgroundColor:P.note2,borderRadius:'3px',boxShadow:PO?undefined:'0 2px 6px rgba(80,70,40,0.10)'},sticker)),wxTag('p',wxS({margin:'0 0 4px',fontFamily:PO?WX_SANS:WX_KAI,fontSize:'14px',fontWeight:PO?'900':'700',color:AC}),(PO?'✸ 划重点 · ':'批注 · ')+l)+para(h,{margin:'0 0 10px',fontSize:(fs-0.5)+'px'})))},
  stats:function(items){return wxTag('table',wxS({width:'100%',margin:'14px 0 22px',borderCollapse:'separate',borderSpacing:'6px 8px'}),'<tbody>'+wxRows(items).map(function(row){return '<tr>'+row.map(function(it,i){return wxTag('td',wxS(wxX({width:(100/row.length).toFixed(2)+'%',padding:'10px 4px',backgroundColor:PO?(i%2?P.note2:P.note):P.card,border:PO?'0':'1.5px dashed '+wxMix(AC,'#ffffff',0.4),borderRadius:PO?'3px':'16px',textAlign:'center',verticalAlign:'top'},PO?{boxShadow:'0 0 0 3px #ffffff'}:{})),wxTag('span',wxS({display:'block',fontFamily:WX_NUM,fontSize:'19px',fontWeight:'900',color:AC,lineHeight:1.25}),it.value)+wxTag('span',wxS({display:'block',marginTop:'4px',fontFamily:PO?WX_SANS:WX_KAI,fontSize:'12px',lineHeight:1.45,color:INKj}),it.label))}).join('')+'</tr>'}).join('')+'</tbody>')},
  figure:function(src,cap){return sec(wxS({margin:'30px 8px 32px'}),tape(PO?P.highlight:P.tape,'80px',-3)+sec(wxS(wxX({padding:'8px 8px 10px',backgroundColor:'#ffffff',boxShadow:'0 4px 12px rgba(110,80,40,0.14)'},PO?{boxShadow:'0 0 0 4px #ffffff, 0 4px 14px rgba(30,40,90,0.18)',transform:'rotate(1deg)'}:{})),wxImg(src,cap,{})+(cap?wxTag('p',wxS({margin:'8px 0 0',fontFamily:PO?WX_SANS:WX_KAI,fontSize:'13px',lineHeight:1.6,color:INKj,textAlign:'center',fontWeight:PO?'700':'400'}),(PO?'✸ ':'✎ ')+cap):'')))},
  ol:function(items){return sec(wxS({margin:'4px 0 '+gap+'px'}),items.map(function(h,i){var f=wxFirstSentence(h);return para(wxTag('span',wxS({display:'inline-block',width:'22px',height:'22px',lineHeight:PO?'22px':'19px',textAlign:'center',borderRadius:'50%',border:PO?'0':'1.5px solid '+AC,backgroundColor:PO?AC:'transparent',color:PO?'#ffffff':AC,fontFamily:WX_NUM,fontSize:'12px',fontWeight:'900',marginRight:'8px',verticalAlign:'1px',boxSizing:'border-box'}),String(i+1))+(f[0]?wxTag('strong',wxS({color:INKj,fontWeight:'800'}),f[0]):'')+f[1],{margin:'0',padding:'10px 0',borderBottom:'1px dashed '+P.line})}).join(''))},
  table:{wrap:{margin:'22px 0 30px',backgroundColor:P.card,border:'1px solid '+P.line},th:{padding:'8px 6px',backgroundColor:PO?P.highlight:P.note,color:INKj,fontWeight:'800',textAlign:'left',borderBottom:'1px solid '+P.line},td:{padding:'9px 6px',borderBottom:'1px dashed '+P.line,color:INKj,verticalAlign:'top'},first:{fontWeight:'800',color:AC}},
  hr:function(){return wxTag('p',wxS({margin:'30px 0',textAlign:'center',color:AC,letterSpacing:'8px',fontSize:'13px'}),PO?'✸ ✸ ✸':'～ ✿ ～')},
  ending:function(h){return para(h)+(PO?wxTag('p',wxS({margin:'40px 0 0',textAlign:'center'}),wxTag('span',wxS({display:'inline-block',backgroundColor:P.highlight,color:INKj,fontWeight:'900',fontSize:'14px',letterSpacing:'4px',padding:'4px 14px',transform:'rotate(-2deg)',boxShadow:'0 0 0 4px #ffffff, 0 3px 10px rgba(30,40,90,0.15)'}),'THE END ✸'))
     :wxTag('p',wxS({margin:'40px 0 0',textAlign:'center',fontFamily:WX_KAI,fontSize:'15px',letterSpacing:'4px',color:AC}),'— 完 —')+wxTag('p',wxS({margin:'6px 0 0',textAlign:'center',fontFamily:WX_KAI,fontSize:'13px',letterSpacing:'2px',color:P.muted}),'～ ✿ ～'))}
 }}

 /* ---------- assemble ---------- */
 var pStyle=L.p||{};if(pStyle.textAlign)base.textAlign=pStyle.textAlign;
 var P_=function(h,extra){return para(h,wxX(pStyle,extra))};
 if(!L.key)L.key=function(h){return P_(wxTag('strong','',h))};
 function table(b){var T=L.table;var tfs=(Number(cfg.font)||15)>=16?'13px':'12.5px';
  if(!tableFollows)return '<table><thead><tr>'+b.head.map(function(x){return '<th>'+x+'</th>'}).join('')+'</tr></thead><tbody>'+b.rows.map(function(r){return '<tr>'+r.map(function(x){return '<td>'+x+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table>';
  var tw=wxX({width:'100%',borderCollapse:'collapse',fontSize:tfs,lineHeight:1.65},T.wrap);
  var cell=function(base,extra){return wxS(wxX(wxX({fontSize:tfs,lineHeight:1.6,letterSpacing:'0.2px',border:base.border||'0'},base),extra))};
  return wxTag('table',wxS(tw),'<thead><tr>'+b.head.map(function(x,j){return wxTag('th',cell(T.th,j===0?{whiteSpace:'nowrap'}:null),x)}).join('')+'</tr></thead><tbody>'+b.rows.map(function(r){return '<tr>'+r.map(function(x,j){var fx=null;if(j===0){fx=wxX({whiteSpace:'nowrap'},T.first)}return wxTag('td',cell(T.td,fx),x)}).join('')+'</tr>'}).join('')+'</tbody>')}
 var inCard=false;
 function openCard(){if(L.wrap&&!inCard){out.push('<section style="'+L.card.replace(/"/g,'&quot;')+'">');inCard=true}}
 function closeCard(){if(inCard){out.push('</section>');inCard=false}}
 if(L.masthead)out.push(L.masthead());
 blocks.forEach(function(b){
  switch(b.t){
   case 'title':out.push(L.title(b.html));break;
   case 'lede':{var r=L.lede(b.html);if(typeof r==='object'){openCard();out.push(r.open)}else out.push(r);break}
   case 'intro':if(L.wrap)openCard();out.push(P_(b.html));break;
   case 'key':if(L.wrap)openCard();out.push(L.key(b.html));break;
   case 'h2':h2i++;h3i=0;if(L.toc&&h2i===1){closeCard();out.push(L.toc())}
    closeCard();openCard();out.push(headFollows?L.h2(b.html,h2i):'<h2>'+(b.full||b.html)+'</h2>');break;
   case 'h3':h3i++;out.push(L.h3(b.html,h2i,h3i));break;
   case 'p':out.push(P_(b.html));break;
   case 'figure':figi++;out.push(L.figure(b.src,b.caption,figi));break;
   case 'quote':out.push(L.quote(b.html,b.cite));break;
   case 'callout':out.push(L.callout(b.label,b.html));break;
   case 'stats':out.push(L.stats(b.items));break;
   case 'ol':out.push(L.ol(b.items));break;
   case 'ul':out.push(wxTag('ul',wxS({margin:'0 0 '+gap+'px',padding:'0 0 0 20px',color:P.ink}),b.items.map(function(h){return wxTag('li',wxS({margin:'0 0 10px',fontSize:fs+'px',lineHeight:lh,color:P.ink,letterSpacing:'0.5px'}),h)}).join('')));break;
   case 'table':out.push(table(b));break;
   case 'hr':out.push(L.hr());break;
   case 'ending':{var e=L.ending(b.html);if(typeof e==='object'){closeCard();openCard();out.push(e.html)}else out.push(e);break}
   case 'raw':out.push(b.el.outerHTML);break;
  }
 });
 closeCard();
 return {html:out.join(''),root:L.root};
}

/* inline elements inside text get explicit styles too */
function wxInlineStyles(article,theme,P){
 var E=wxEm(theme,P);
 Array.prototype.forEach.call(article.querySelectorAll('strong,b'),function(el){if(!el.getAttribute('style'))el.setAttribute('style',wxS(E.strong))});
 Array.prototype.forEach.call(article.querySelectorAll('span[data-wxm]'),function(el){var k=el.getAttribute('data-wxm');el.removeAttribute('data-wxm');if(E[k])el.setAttribute('style',wxS(E[k]))});
 Array.prototype.forEach.call(article.querySelectorAll('em,i'),function(el){if(!el.getAttribute('style'))el.setAttribute('style','font-style:italic;color:inherit')});
 Array.prototype.forEach.call(article.querySelectorAll('code'),function(el){el.setAttribute('style','font-family:'+WX_MONO.replace(/"/g,"'")+';font-size:0.9em;padding:1px 4px;border-radius:3px;background-color:'+(P.soft||'#f3f3f3')+';color:'+P.ink)});
 Array.prototype.forEach.call(article.querySelectorAll('a'),function(el){if(!el.getAttribute('style'))el.setAttribute('style','color:'+(P.highlightText||P.accent)+';text-decoration:none;border-bottom:1px solid '+(P.highlightText||P.accent))});
}

function wxLayoutDecorate(article,config){
 var theme=config.theme;if(!wxLayouts[theme])return false;
 var P=wxPalette(config);
 article.innerHTML=wxMarkers(article.innerHTML);
 var blocks=wxBlocks(article);
 var built=wxBuild(theme,P,config,blocks);
 article.innerHTML=built.html;
 var r=built.root;
 article.style.cssText+=';'+wxS({margin:'0',padding:r.padding,backgroundColor:r.backgroundColor,backgroundImage:r.backgroundImage,backgroundSize:r.backgroundSize,color:P.ink,fontFamily:r.fontFamily||WX_SANS,fontSize:(Number(config.font)||15)+'px',lineHeight:Number(config.line)||1.85,letterSpacing:'0.5px',textAlign:'left',boxSizing:'border-box',maxWidth:'100%',border:'0',borderRadius:'0'});
 if(!r.backgroundImage)article.style.removeProperty('background-image');
 article.style.removeProperty('height');article.style.removeProperty('min-height');
 var fc=(typeof fontChoices!=='undefined'&&config.fontChoice&&config.fontChoice!=='theme')?fontChoices[config.fontChoice]:null;if(fc&&fc.stack)article.style.fontFamily=fc.stack;
 article.dataset.layoutRecipe=theme+(P.variant?'-'+P.variant:'');
 wxInlineStyles(article,theme,P);
 return true;
}
/* ==== end wx-layouts ==== */
